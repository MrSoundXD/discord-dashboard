require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, REST, Routes, ActivityType, PermissionsBitField } = require('discord.js');
const cors = require('cors');
const util = require('minecraft-server-util');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
    discordId: String,
    username: String,
    accessToken: String,
    avatar: String
});
const User = mongoose.model('User', UserSchema);

const GuildConfigSchema = new mongoose.Schema({
    guildId: String,
    mcServerIp: { type: String, default: 'play.hypixel.net' },
    customCommands: [{ trigger: String, response: String }]
});
const GuildConfig = mongoose.model('GuildConfig', GuildConfigSchema);

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration 
    ] 
});

const commands = [
    { name: 'panel', description: 'Dashboard Link' },
    { name: 'mc-ip', description: 'Toon het IP van de Minecraft server' },
    { name: 'mc-status', description: 'Check of de server online is' }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    client.user.setActivity('Minecraft & Commands', { type: ActivityType.Playing });
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const config = await GuildConfig.findOne({ guildId: interaction.guildId }) || new GuildConfig({ mcServerIp: 'play.hypixel.net' });

    if (interaction.commandName === 'panel') {
        await interaction.reply({ content: `Dashboard:\n${FRONTEND_URL}`, ephemeral: true });
    }

    if (interaction.commandName === 'mc-ip') {
        await interaction.reply(`**Server IP:** \`${config.mcServerIp}\``);
    }

    if (interaction.commandName === 'mc-status') {
        await interaction.deferReply();
        try {
            const status = await util.status(config.mcServerIp);
            await interaction.editReply(`🟢 **ONLINE**\nSpelers: ${status.players.online}/${status.players.max}\nVersie: ${status.version.name}`);
        } catch (e) {
            await interaction.editReply('🔴 **OFFLINE**');
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    const config = await GuildConfig.findOne({ guildId: message.guildId });
    if (!config || !config.customCommands) return;

    const cmd = config.customCommands.find(c => c.trigger === message.content);
    if (cmd) {
        message.channel.send(cmd.response);
    }
});

client.login(process.env.DISCORD_TOKEN);

app.get('/api/auth/login', (req, res) => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(authUrl);
});

app.get('/api/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send('No code');
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', 
            querystring.stringify({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.REDIRECT_URI,
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenRes.data.access_token;
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { id, username, avatar } = userRes.data;
        await User.findOneAndUpdate(
            { discordId: id }, 
            { discordId: id, username, avatar, accessToken }, 
            { upsert: true, new: true }
        );

        res.redirect(`${FRONTEND_URL}?uid=${id}`);
    } catch (error) {
        console.error(error);
        res.send('Login failed');
    }
});

app.get('/api/user/:discordId', async (req, res) => {
    const user = await User.findOne({ discordId: req.params.discordId });
    if (!user) return res.status(404).send('User not found');
    res.json(user);
});

app.get('/api/user/:discordId/guilds', async (req, res) => {
    const user = await User.findOne({ discordId: req.params.discordId });
    if (!user) return res.status(401).send('Unauthorized');

    try {
        const response = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        
        const adminGuilds = response.data.filter(g => (BigInt(g.permissions) & 0x20n) === 0x20n);
        res.json(adminGuilds);
    } catch (e) {
        res.status(500).send('Discord API Error');
    }
});

app.get('/api/guild/:guildId', async (req, res) => {
    let config = await GuildConfig.findOne({ guildId: req.params.guildId });
    if (!config) config = new GuildConfig({ guildId: req.params.guildId });
    res.json(config);
});

app.post('/api/guild/:guildId/config', async (req, res) => {
    const { mcServerIp } = req.body;
    await GuildConfig.findOneAndUpdate(
        { guildId: req.params.guildId }, 
        { mcServerIp }, 
        { upsert: true }
    );
    res.json({ success: true });
});

app.post('/api/guild/:guildId/command', async (req, res) => {
    const { trigger, response } = req.body;
    await GuildConfig.findOneAndUpdate(
        { guildId: req.params.guildId },
        { $push: { customCommands: { trigger, response } } },
        { upsert: true }
    );
    res.json({ success: true });
});

app.delete('/api/guild/:guildId/command', async (req, res) => {
    const { trigger } = req.body;
    await GuildConfig.findOneAndUpdate(
        { guildId: req.params.guildId },
        { $pull: { customCommands: { trigger } } }
    );
    res.json({ success: true });
});

app.get('/api/guild/:guildId/bans', async (req, res) => {
    try {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.json({ error: 'Bot niet in server' });
        
        const bans = await guild.bans.fetch();
        const banList = bans.map(ban => ({
            user: ban.user.username,
            reason: ban.reason
        }));
        res.json(banList);
    } catch (e) {
        res.json({ error: 'Geen permissies of error' });
    }
});

app.get('/api/minecraft/:ip', async (req, res) => {
    try {
        const result = await util.status(req.params.ip);
        res.json({
            online: true,
            players: result.players.online,
            max: result.players.max,
            version: result.version.name,
            motd: result.motd.clean,
            favicon: result.favicon
        });
    } catch (error) {
        res.json({ online: false });
    }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, REST, Routes, ActivityType } = require('discord.js');
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
    avatar: String,
    mcServerIp: { type: String, default: 'play.hypixel.net' } 
});
const User = mongoose.model('User', UserSchema);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    { name: 'panel', description: 'Dashboard Link' },
    { name: 'help', description: 'Info' }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    client.user.setActivity('Minecraft Servers', { type: ActivityType.Watching });
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'panel') {
        await interaction.reply({ 
            content: `Link:\n${FRONTEND_URL}`, 
            ephemeral: true 
        });
    }

    if (interaction.commandName === 'help') {
        await interaction.reply('Gebruik /panel');
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

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });

        const { id, username, avatar } = userRes.data;

        let user = await User.findOne({ discordId: id });
        if (!user) {
            user = new User({ discordId: id, username, avatar });
            await user.save();
        }

        res.redirect(`${FRONTEND_URL}?uid=${id}`);

    } catch (error) {
        console.error(error);
        res.send('Login failed');
    }
});

app.get('/api/user/:discordId', async (req, res) => {
    const user = await User.findOne({ discordId: req.params.discordId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

app.post('/api/user/:discordId/config', async (req, res) => {
    const { mcServerIp } = req.body;
    await User.findOneAndUpdate({ discordId: req.params.discordId }, { mcServerIp });
    res.json({ success: true });
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
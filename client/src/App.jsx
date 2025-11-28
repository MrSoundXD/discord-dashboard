import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://discord-dashboard-dxop.onrender.com'; 

function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [activeTab, setActiveTab] = useState('config'); // config, bans, commands

  // Data states
  const [config, setConfig] = useState({ mcServerIp: '', customCommands: [] });
  const [mcStats, setMcStats] = useState(null);
  const [bans, setBans] = useState([]);
  const [newCmd, setNewCmd] = useState({ trigger: '', response: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    if (uid) {
        fetchUserAndGuilds(uid);
        window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const fetchUserAndGuilds = async (uid) => {
    try {
        const userRes = await axios.get(`${API_URL}/api/user/${uid}`);
        setUser(userRes.data);
        const guildsRes = await axios.get(`${API_URL}/api/user/${uid}/guilds`);
        setGuilds(guildsRes.data);
    } catch (e) { console.error(e); }
  };

  const selectGuild = async (guild) => {
    setSelectedGuild(guild);
    try {
        const res = await axios.get(`${API_URL}/api/guild/${guild.id}`);
        setConfig(res.data);
        if(res.data.mcServerIp) fetchMcStats(res.data.mcServerIp);
    } catch (e) { console.error(e); }
  };

  const fetchMcStats = async (ip) => {
      setMcStats(null);
      try {
          const res = await axios.get(`${API_URL}/api/minecraft/${ip}`);
          setMcStats(res.data);
      } catch (e) { console.error(e); }
  };

  const fetchBans = async () => {
      try {
          const res = await axios.get(`${API_URL}/api/guild/${selectedGuild.id}/bans`);
          setBans(res.data.error ? [] : res.data);
      } catch (e) { setBans([]); }
  };

  useEffect(() => {
      if(selectedGuild && activeTab === 'bans') fetchBans();
  }, [activeTab, selectedGuild]);

  const saveConfig = async () => {
      await axios.post(`${API_URL}/api/guild/${selectedGuild.id}/config`, { mcServerIp: config.mcServerIp });
      alert('Opgeslagen!');
      fetchMcStats(config.mcServerIp);
  };

  const addCommand = async () => {
      if(!newCmd.trigger || !newCmd.response) return;
      await axios.post(`${API_URL}/api/guild/${selectedGuild.id}/command`, newCmd);
      setConfig(prev => ({ ...prev, customCommands: [...prev.customCommands, newCmd] }));
      setNewCmd({ trigger: '', response: '' });
  };

  const deleteCommand = async (trigger) => {
      await axios.delete(`${API_URL}/api/guild/${selectedGuild.id}/command`, { data: { trigger } });
      setConfig(prev => ({ ...prev, customCommands: prev.customCommands.filter(c => c.trigger !== trigger) }));
  };

  const handleLogin = () => window.location.href = `${API_URL}/api/auth/login`;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl text-[#FFAA00] drop-shadow-[4px_4px_0_#000] mb-8">ULTIMATE DASHBOARD</h1>
        <button onClick={handleLogin} className="mc-btn bg-[#5865F2] text-white px-8 py-4 text-2xl">Login met Discord</button>
      </div>
    );
  }

  if (!selectedGuild) {
    return (
      <div className="min-h-screen p-10 flex flex-col items-center">
        <h2 className="text-4xl text-white mb-8">Kies een server</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guilds.map(guild => (
                <div key={guild.id} onClick={() => selectGuild(guild)} className="mc-panel p-4 cursor-pointer hover:bg-[#d6d6d6] flex items-center gap-4 transition-transform hover:scale-105">
                    {guild.icon ? <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} className="w-16 h-16 rounded-full" /> : <div className="w-16 h-16 bg-gray-700 rounded-full"></div>}
                    <div className="text-xl font-bold truncate">{guild.name}</div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
        <button onClick={() => setSelectedGuild(null)} className="mb-6 text-gray-400 hover:text-white">← Terug naar servers</button>
        
        <div className="flex flex-col md:flex-row gap-8">
            {/* SIDEBAR */}
            <div className="w-full md:w-64 space-y-2">
                <div className="mc-panel p-4 mb-4 text-center">
                    {selectedGuild.icon && <img src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`} className="w-20 h-20 rounded-full mx-auto mb-2" />}
                    <h2 className="font-bold text-xl truncate">{selectedGuild.name}</h2>
                </div>
                <button onClick={() => setActiveTab('config')} className={`mc-btn w-full p-3 ${activeTab === 'config' ? 'bg-[#458a26] text-white' : 'bg-[#ccc] text-black'}`}>Minecraft Config</button>
                <button onClick={() => setActiveTab('commands')} className={`mc-btn w-full p-3 ${activeTab === 'commands' ? 'bg-[#458a26] text-white' : 'bg-[#ccc] text-black'}`}>Custom Commands</button>
                <button onClick={() => setActiveTab('bans')} className={`mc-btn w-full p-3 ${activeTab === 'bans' ? 'bg-[#A00] text-white' : 'bg-[#ccc] text-black'}`}>Banned Users</button>
            </div>

            {/* CONTENT */}
            <div className="flex-1">
                
                {/* CONFIG TAB */}
                {activeTab === 'config' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="mc-panel p-6">
                            <h3 className="text-2xl mb-4 border-b-2 border-gray-600 pb-2">Server IP Instellen</h3>
                            <input type="text" value={config.mcServerIp} onChange={e => setConfig({...config, mcServerIp: e.target.value})} className="mc-input w-full mb-4" placeholder="play.hypixel.net" />
                            <button onClick={saveConfig} className="mc-btn bg-[#458a26] text-white px-6 py-2">Opslaan</button>
                        </div>
                        {mcStats && (
                            <div className="mc-panel p-6 bg-[url('https://assets.codepen.io/13471/dirt-bg.jpg')] text-white text-center relative">
                                {mcStats.online ? (
                                    <>
                                        {mcStats.favicon && <img src={mcStats.favicon} className="w-16 h-16 mx-auto border-2 border-black mb-2" />}
                                        <div className="text-3xl font-bold shadow-black drop-shadow-md">{config.mcServerIp}</div>
                                        <div className="text-green-400 text-xl mt-2">{mcStats.players} / {mcStats.max} Spelers</div>
                                        <div className="text-gray-300">{mcStats.version}</div>
                                    </>
                                ) : <div className="text-red-500 font-bold text-2xl mt-10">OFFLINE</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* COMMANDS TAB */}
                {activeTab === 'commands' && (
                    <div className="mc-panel p-6">
                        <h3 className="text-2xl mb-4">Custom Commands</h3>
                        <div className="flex gap-2 mb-6">
                            <input type="text" placeholder="Trigger (bv. !help)" value={newCmd.trigger} onChange={e => setNewCmd({...newCmd, trigger: e.target.value})} className="mc-input flex-1" />
                            <input type="text" placeholder="Response" value={newCmd.response} onChange={e => setNewCmd({...newCmd, response: e.target.value})} className="mc-input flex-1" />
                            <button onClick={addCommand} className="mc-btn bg-[#5865F2] text-white px-4">+</button>
                        </div>
                        <div className="space-y-2">
                            {config.customCommands?.map((cmd, i) => (
                                <div key={i} className="bg-[#333] text-white p-3 border-2 border-white flex justify-between items-center">
                                    <div><span className="text-[#FFAA00] font-bold">{cmd.trigger}</span> → {cmd.response}</div>
                                    <button onClick={() => deleteCommand(cmd.trigger)} className="text-red-400 hover:text-red-200">DELETE</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BANS TAB */}
                {activeTab === 'bans' && (
                    <div className="mc-panel p-6">
                        <h3 className="text-2xl mb-4 text-red-800">Server Ban List</h3>
                        {bans.length === 0 ? <p>Geen bans gevonden of bot mist permissies.</p> : (
                            <div className="grid grid-cols-1 gap-2">
                                {bans.map((ban, i) => (
                                    <div key={i} className="bg-[#222] text-white p-3 border border-red-900 flex justify-between">
                                        <span className="font-bold">{ban.user}</span>
                                        <span className="text-gray-400 italic">{ban.reason || "Geen reden"}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default App;
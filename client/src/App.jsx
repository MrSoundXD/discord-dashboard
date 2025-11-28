import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://discord-dashboard-dxop.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [mcStats, setMcStats] = useState({ 
    online: false, players: 0, max: 0, version: '-', motd: '', favicon: null 
  });
  const [inputIp, setInputIp] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    if (uid) {
        fetchUserData(uid);
        window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const fetchUserData = async (discordId) => {
    try {
      const res = await axios.get(`${API_URL}/api/user/${discordId}`);
      setUser(res.data);
      setInputIp(res.data.mcServerIp);
      fetchMcStats(res.data.mcServerIp);
    } catch (e) { console.error(e); }
  };

  const fetchMcStats = async (ip) => {
    setMcStats(prev => ({ ...prev, online: false })); 
    try {
      const res = await axios.get(`${API_URL}/api/minecraft/${ip}`);
      setMcStats(res.data);
    } catch (e) { console.error(e); }
  };

  const saveConfig = async () => {
    if(!user) return;
    await axios.post(`${API_URL}/api/user/${user.discordId}/config`, { mcServerIp: inputIp });
    alert("Saved!");
    fetchMcStats(inputIp);
    setUser({...user, mcServerIp: inputIp});
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/api/auth/login`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl text-[#FFAA00] drop-shadow-[4px_4px_0_#000] mb-2">
        SERVER DASHBOARD
      </h1>
      <p className="text-gray-400 mb-10 text-xl">Monitor</p>

      {!user ? (
        <div className="text-center animate-bounce">
             <button onClick={handleLogin} className="mc-btn bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 text-3xl">
                Login Discord
             </button>
        </div>
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
                <div className="flex items-center gap-4 bg-[#222] p-4 border-l-4 border-[#FFAA00] shadow-lg">
                    <img 
                        src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`} 
                        className="w-16 h-16 rounded-full border-2 border-white" 
                        alt="Avatar"
                    />
                    <div>
                        <div className="text-gray-400 text-sm">USER</div>
                        <div className="text-2xl font-bold text-[#FFAA00]">{user.username}</div>
                    </div>
                </div>

                <div className="mc-panel p-6">
                    <h2 className="text-3xl mb-4 border-b-2 border-[#888] pb-2">Config</h2>
                    
                    <label className="block text-gray-700 font-bold mb-1 text-xl">Server IP</label>
                    <input 
                        type="text" 
                        value={inputIp} 
                        onChange={(e) => setInputIp(e.target.value)}
                        className="mc-input w-full mb-4"
                        placeholder="play.hypixel.net"
                    />

                    <button onClick={saveConfig} className="mc-btn bg-[#458a26] hover:bg-[#38701f] text-white px-6 w-full py-3 text-xl">
                        SAVE
                    </button>
                </div>
            </div>

            <div className="mc-panel p-0 overflow-hidden relative min-h-[300px] flex flex-col">
                <div className="absolute inset-0 bg-[url('https://assets.codepen.io/13471/dirt-bg.jpg')] opacity-80 z-0"></div>
                
                <div className="absolute top-4 right-4 bg-[#ff0000] text-white px-3 py-1 border-2 border-black z-10 animate-pulse font-bold">
                    LIVE
                </div>

                <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full text-center space-y-4">
                    {mcStats.online ? (
                        <>
                            {mcStats.favicon ? (
                                <img src={mcStats.favicon} className="w-24 h-24 border-4 border-black shadow-xl" />
                            ) : (
                                <div className="w-24 h-24 bg-gray-800 border-4 border-black flex items-center justify-center text-4xl">?</div>
                            )}
                            
                            <div>
                                <h2 className="text-4xl font-bold text-white drop-shadow-[2px_2px_0_#000]">{inputIp}</h2>
                                {mcStats.motd && (
                                    <div className="text-[#55FF55] bg-black/60 px-2 py-1 mt-2 text-lg rounded inline-block">
                                        {mcStats.motd}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                <div className="bg-[#222]/90 p-3 border-2 border-white/20">
                                    <div className="text-gray-400 text-sm">PLAYERS</div>
                                    <div className="text-2xl text-white">{mcStats.players} <span className="text-gray-500">/</span> {mcStats.max}</div>
                                </div>
                                <div className="bg-[#222]/90 p-3 border-2 border-white/20">
                                    <div className="text-gray-400 text-sm">VERSION</div>
                                    <div className="text-2xl text-white">{mcStats.version}</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="text-[#FF5555] text-4xl font-bold bg-black/50 px-4 py-2 rounded">OFFLINE</div>
                            <p className="text-white mt-2 text-lg">{inputIp}</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      )}
      
      <div className="mt-12 text-gray-600">Portfolio 2025</div>
    </div>
  );
}

export default App;
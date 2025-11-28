# 🎮 Discord & Minecraft Integration Dashboard

![Java](https://img.shields.io/badge/Minecraft-Java_Edition-orange?logo=minecraft)
![NodeJS](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)
![React](https://img.shields.io/badge/React-v18-blue?logo=react)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-forestgreen?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-blue)
![Status](https://img.shields.io/badge/Status-Live-brightgreen)

Full-stack SaaS application for managing Discord communities and Minecraft servers.  
Users can log in with Discord, manage their servers, view Minecraft stats, and set up custom bot commands.

## 🚀 Features

* **OAuth2 Authentication:** Secure login via Discord.
* **Multi-Server Support:** Manage all your Discord servers from one dashboard.
* **Live Minecraft Stats:** Real-time player counts, version, and server status.
* **Custom Commands:** Add commands to your Discord bot via the dashboard.
* **Moderation:** View your server's ban list directly on the web.
* **Discord Bot:** Built-in slash commands (`/mc-ip`, `/mc-status`).

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **External APIs:** Discord API, Minecraft Protocol

## 📦 Installation & Setup

### Running Locally

1.  Clone the repo:
    ```bash
    git clone [https://github.com/YOURNAME/discord-dashboard.git](https://github.com/YOURNAME/discord-dashboard.git)
    ```
2.  Backend setup:
    ```bash
    cd server
    npm install
    # Create a .env file with your tokens
    node index.js
    ```
3.  Frontend setup:
    ```bash
    cd client
    npm install
    npm run dev
    ```

### Deployment

* **Backend:** Hosted on Render.com
* **Frontend:** Hosted on Vercel.com
* **Database:** MongoDB Atlas

## 🛡️ Discord Bot Setup

Make sure the bot has the following **Privileged Intents** enabled in the Developer Portal:
* Presence Intent
* Server Members Intent
* Message Content Intent
* Guild Bans Intent (New!)

---
*Created as a Portfolio Project - 2025*

# 🌟 Disboard Auto-Bump Selfbot

Effortlessly keep your Discord server at the top of Disboard listings!  
This selfbot automatically sends the `/bump` command at random intervals, helping you avoid detection and manual effort.

---

## ⚡ Features

- **Automatic Bumping:** Sends `/bump` at random intervals (2–2.5 hours).
- **Logging:** Notifies a log channel every time your server is bumped.
- **Easy Setup:** Simple environment configuration.
- **Educational Purpose:** Learn how selfbots work (see disclaimer).

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your Discord Token

> **Warning:** Using selfbots is against Discord's Terms of Service and can result in account termination.  
> Use only on temporary/test accounts for educational purposes.

To get your Discord token:
1. Open [Discord in your browser](https://discord.com/app).
2. Press <kbd>F12</kbd> to open Developer Tools.
3. Go to the **Console** tab.
4. Paste and run the following code:

```javascript
(webpackChunkdiscord_app.push([[''],{},e=>{m=[];
for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
```

5. Copy the token that appears.

---

### 3. Setup Environment Variables

Copy the sample environment file:

```bash
cp .envsample .env
```

Edit `.env` and fill in:

- `TOKEN`: Your Discord account token (from above)
- `BUMP_CHANNEL`: The channel ID where `/bump` should be sent
- `LOG_CHANNEL`: The channel ID for bump logs

---

### 4. Start the Bot

```bash
npm start
```

---

## 📝 Example `.env` File

```properties
TOKEN=your_discord_token_here
BUMP_CHANNEL=your_bump_channel_id
LOG_CHANNEL=your_log_channel_id
```

---

## ❗ Disclaimer

> **Selfbots are strictly against Discord's Terms of Service.  
> This project is for educational purposes only.  
> Use at your own risk.**

---

## 📚 How It Works

- The bot logs in as your Discord account.
- It sends the `/bump` command in your chosen channel at random intervals (between 2 and 2.5 hours).
- Each bump is logged in a separate channel for tracking.
- Random intervals help avoid detection by automated systems.


---

## 🛠️ Advanced & Production Run

For long-term or production use, you can run the bot with [PM2](https://pm2.keymetrics.io/), a process manager that keeps your bot alive and restarts it if it crashes.

### 1. Install PM2 Globally

```bash
npm install pm2 -g
```

### 2. Start the Bot with PM2

```bash
pm2 start index.js
```

This will keep your bot running in the background, even after you close your terminal.

To view logs:

```bash
pm2 logs index
```

To stop the bot:

```bash
pm2 stop index
```


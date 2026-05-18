<div align="center">
  <br/>
  <img src="https://api.dicebear.com/9.x/shapes/svg?seed=tempmail&scale=200&backgroundType=gradientLinear&backgroundRotation=0,360" width="120" alt="TempMail Pro"/>
  <br/>
  <h1>📧 TempMail Pro</h1>
  <p><strong>🏆 The World's Most Relaxing Temp Mail Experience</strong></p>
  <p>Zero popups • Auto-refresh • Dark mode • OTP copy • No signup • Unlimited</p>
  <br/>

  <p>
    <a href="https://tempmail-egsg0qt8g-imrandev.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/Live_Demo-6366f1?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
    </a>
    <a href="https://github.com/ImranDev3/tempmail">
      <img src="https://img.shields.io/badge/Open_Source-22c55e?style=for-the-badge&logo=github&logoColor=white" alt="Open Source"/>
    </a>
    <a href="https://github.com/ImranDev3/tempmail/stargazers">
      <img src="https://img.shields.io/github/stars/ImranDev3/tempmail?style=for-the-badge&logo=github&color=fbbf24" alt="Stars"/>
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Powered_by-1secmail-6366f1?style=flat-square"/>
    <img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel"/>
    <img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square"/>
    <img src="https://img.shields.io/badge/Stack-Vanilla_JS-f7df1e?style=flat-square&logo=javascript"/>
    <img src="https://img.shields.io/badge/Zero_Popups-10b981?style=flat-square"/>
  </p>

  <br/>
</div>

---

## ✨ Premium Features

| Feature | Description |
|---------|-------------|
| 🚀 **One-Click Generate** | Instant disposable email — no signup, no delay |
| 🔄 **Silent Auto-Refresh** | Inbox auto-checks every 8s — zero clicks needed |
| 🌙 **Dark Mode** | Eye-friendly theme with one-click toggle |
| 🔢 **OTP Auto-Detect** | Verification codes highlighted in green badges |
| 📋 **Click OTP to Copy** | Tap any OTP badge to copy code instantly |
| 📝 **Message Previews** | See email body preview right in the inbox list |
| 🎯 **Auto-Copy on Generate** | Email auto-copies to clipboard when created |
| 💾 **Persistent Storage** | Emails survive page refreshes (localStorage) |
| 📱 **Mobile First** | Fully responsive on every screen size |
| 🚫 **Zero Popups** | No annoying notifications — clean, silent UX |

---

## 🥇 Why TempMail Pro is Better

| Feature | TempMail Pro | Other Temp Mail Sites |
|---------|:------------:|:---------------------:|
| 🚫 **Popups & Ads** | ❌ Zero | ✅ Full of ads |
| 🌙 **Dark Mode** | ✅ Yes | ❌ Rarely |
| 🔄 **Auto-Refresh** | ✅ Silent (8s) | ❌ Manual only |
| 📋 **OTP Click-to-Copy** | ✅ Yes | ❌ No |
| 📝 **Message Preview** | ✅ Yes | ❌ No |
| 🎯 **Auto-Copy Email** | ✅ On generate | ❌ No |
| 💾 **Survives Refresh** | ✅ localStorage | ❌ Lost |
| 🌐 **Open Source** | ✅ Full code | ❌ Closed |
| 💰 **Pricing** | 🆓 **Free Forever** | 💵 Paid limits |
| ⚡ **Speed** | 🚀 Instant | 🐌 Slow |

---

## 🚀 Quick Start

### Run Locally
```bash
# 1. Clone the repository
git clone https://github.com/ImranDev3/tempmail.git
cd tempmail

# 2. Open in browser (no build step needed!)
open index.html
```

### Deploy on Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel
```
Or just connect your GitHub repo to [vercel.com](https://vercel.com) — zero config needed.

---

## 📁 Project Structure

```
tempmail/
├── index.html          # Main application page
├── css/
│   └── style.css       # Responsive styles
├── js/
│   └── app.js          # Core application logic
├── api/
│   └── proxy.js        # Vercel serverless proxy
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

---

## 🛠️ How It Works

```
Browser (index.html) → Vercel Proxy (api/proxy.js) → 1secmail API (free)
```

1. **User clicks** "Generate New Email"
2. **Vercel serverless function** proxies the request to 1secmail API
3. **A random disposable email** is created instantly
4. **Inbox auto-checks** for new messages every few seconds
5. **OTP codes** are automatically highlighted in green badges
6. **All data persists** via localStorage — survives page refreshes

No database. No authentication. No backend infrastructure. Just pure simplicity.

---

## 💻 Tech Stack

| Technology | Purpose |
|------------|---------|
| ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) | Structure & semantics |
| ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | Responsive design, animations |
| ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Core application logic |
| ![Vercel](https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel&logoColor=white) | Hosting + serverless functions |
| ![1secmail](https://img.shields.io/badge/-1secmail_API-6366f1?style=flat-square) | Temporary email backend |

---

## 🔒 Privacy & Security

- ✅ **No data stored on servers** — all email data is ephemeral
- ✅ **No cookies** — zero tracking
- ✅ **No registration** — 100% anonymous usage
- ✅ **Open source** — fully transparent codebase
- ✅ **HTTPS** — encrypted connection via Vercel CDN

TempMail is designed for privacy. Use it for:
- Testing email verification flows
- Avoiding spam on signups
- Protecting your real email address
- Quick OTP/code receipts

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing`)
5. **Open a Pull Request**

---

## 📄 License

This project is **MIT licensed** — free to use, modify, and distribute.

```
MIT License

Copyright (c) 2026 ImranDev3

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

<div align="center">
  <br/>
  <p>
    Made with ❤️ by <a href="https://github.com/ImranDev3">ImranDev3</a>
  </p>
  <p>
    <a href="https://github.com/ImranDev3/tempmail/issues">
      <img src="https://img.shields.io/badge/Report_Bug-ef4444?style=for-the-badge&logo=github&logoColor=white"/>
    </a>
    <a href="https://github.com/ImranDev3/tempmail/issues">
      <img src="https://img.shields.io/badge/Request_Feature-6366f1?style=for-the-badge&logo=github&logoColor=white"/>
    </a>
  </p>
  <br/>
</div>

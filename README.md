# 🕰️ PREDIQ Time Machine

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-prediq.netlify.app-00ff88?style=for-the-badge&logo=netlify)](https://prediq.netlify.app)
[![Accuracy](https://img.shields.io/badge/Accuracy-83.3%25%20Verified-00ff88?style=for-the-badge)](https://prediq.netlify.app)
[![Beats GPT-5](https://img.shields.io/badge/Beats%20GPT--5-%2B14.6%25-00d4ff?style=for-the-badge)](https://prediq.netlify.app)
[![GitHub Stars](https://img.shields.io/github/stars/Vinseek91/PREDIQ-Time-Machine?style=for-the-badge&color=ffd700)](https://github.com/Vinseek91/PREDIQ-Time-Machine/stargazers)

**AI-powered stock prediction platform with 83.3% verified accuracy across India, Chile and US markets**

[🚀 Live Demo](https://prediq.netlify.app) · [📊 View Signals](https://prediq.netlify.app/signals) · [🤖 AI Analyst](https://prediq.netlify.app/ai)

</div>

---

![PREDIQ Time Machine Screenshot](https://prediq.netlify.app/templates/India%20Open.png)

---

## ✨ Features

- 🤖 **AI Agent Team** — CEO, Research, Risk & Execution agents working autonomously
- 📊 **Real-time signals** for India (NSE/BSE), Chile (IPSA) and US (NYSE/NASDAQ) markets
- 🎯 **83.3% verified accuracy** — beats GPT-5 by +14.6% on market predictions
- 📱 **Telegram auto-signals** with entry price, stop loss and target at market open & close
- 🌍 **Multi-market coverage** — 60+ stocks across 3 continents, 6 daily market events
- ⚡ **Elite AI Analyst** with streaming NDJSON responses and agentic tool use
- 🖼️ **Auto-generated signal cards** posted to Telegram and LinkedIn at market open/close
- 📈 **Swarm intelligence engine** — 50 AI fish agents voting on every signal

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, asyncpg |
| AI | Claude Haiku (Anthropic), Swarm Intelligence |
| Database | PostgreSQL (Railway) |
| Deployment | Railway (API) + Netlify (Frontend) |
| Signals | Telegram Bot API, LinkedIn API, Buffer |

---

## 🚀 Live Demo

**[prediq.netlify.app](https://prediq.netlify.app)**

- View live AI signals for India, Chile and US markets
- Watch the CEO Agent run autonomously at market open
- See real-time accuracy tracking vs GPT-5

---

## ⚡ Quick Start

```bash
# Clone the repo
git clone https://github.com/Vinseek91/PREDIQ-Time-Machine.git
cd PREDIQ-Time-Machine

# Frontend
cd frontend
npm install
npm run dev

# Backend
cd ../backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables

**Backend** (Railway):
```env
ANTHROPIC_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
DATABASE_URL=your_postgres_url
OPENAI_API_KEY=your_key
SCREENSHOT_API_KEY=your_key
SCREENSHOT_SECRET_KEY=your_key
LINKEDIN_ACCESS_TOKEN=your_token
```

**Frontend** (Netlify):
```env
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
```

---

## 🤖 How the AI Agent Works

1. **Screen** — scans 60+ stocks for AI-generated predictions
2. **Analyse** — swarm of 50 AI agents vote on direction and confidence
3. **Validate** — enforces minimum 2:1 reward/risk ratio
4. **Signal** — broadcasts BUY/SELL with entry, stop and target to Telegram
5. **Post** — auto-generates signal card image and posts to LinkedIn

Runs automatically at every market open and close: India 🇮🇳 · Chile 🇨🇱 · US 🇺🇸

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repo
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Vinseek91](https://github.com/Vinseek91)

---

<div align="center">

Built with ❤️ using Claude AI · **[⭐ Star this repo](https://github.com/Vinseek91/PREDIQ-Time-Machine/stargazers)** if you find it useful!

</div>

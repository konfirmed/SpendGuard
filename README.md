# WebAssistant 🧠🧾

**WebAssistant** is a browser-based AI companion that helps you make smarter, more intentional decisions online—especially around spending. It sits quietly in your browser and intervenes at the point of decision, helping reduce regret, impulse buys, and poor financial timing.

---

## 🔍 What It Does

- ⏳ **Cooldown Before Checkout**: Adds a thoughtful delay before purchases with gentle nudges.
- 🧠 **Smart Purchase Journal**: Tracks why you buy, helping identify patterns of satisfaction or regret.
- 📉 **Spending Insights**: Shows you monthly spend by category based on online behavior.
- 🔔 **Contextual Reminders**: “You returned this item last time” or “This exceeds your spending cap.”
- 🛡 **Scam Detection**: Warns about potentially risky websites or stores.
- 🛒 **Price History + Alternatives**: Get pricing trends and cheaper options before you commit.

---

## 🧑‍💻 Tech Stack

- **Frontend**: React (Chrome Extension, Manifest V3)
- **Styling**: Tailwind CSS, Shadow DOM
- **AI Layer**: OpenAI GPT-4-turbo (decision reasoning, nudges)
- **Storage**: IndexedDB / Chrome Storage API (local-first)
- **Optional Backend**: Supabase (purchase logs, auth)
- **Data Sources**: CamelCamelCamel, Yahoo Finance, TrustPilot, Google Safe Browsing

---

## 🚀 Getting Started

1. Clone the repo
2. Run `npm install`
3. Develop locally with `npm run dev`
4. Load the extension in Chrome (navigate to `chrome://extensions/`, enable Developer Mode, and load unpacked)

---

## 💡 Philosophy

> “We don’t need more dashboards. We need intelligent friction at the moment of choice.”

WebAssistant doesn't block you. It helps you reflect, pause, and proceed with clarity—acting as a trusted guide for your browser life.

---

## 🧪 Roadmap

- [ ] MVP extension build
- [ ] Smart intercept engine
- [ ] GPT-integrated journaling
- [ ] Scam detector
- [ ] Pro tier paywall
- [ ] Public launch + waitlist

---

## 🙌 Contributors

Built by [Kanmi Obasa](https://kanmi.knfrmd.dev)  
Contributions welcome. Stay decisive.

---

## 🛡️ License

[MIT](./LICENSE)
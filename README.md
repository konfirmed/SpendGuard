# SpendGuard 🛡️🧾

**SpendGuard** is a browser-based AI companion that helps you make smarter, more intentional decisions online—especially around spending. It sits quietly in your browser and intervenes at the point of decision, helping reduce regret, impulse buys, and poor financial timing.

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
- **Data Sources**: CamelCamelCamel, Yahoo Finance, TrustPilot, Google Safe Browsing

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Chrome browser
- (Optional) OpenAI API key for AI-powered nudges

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spendguard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your OpenAI API key
   ```

4. **Build the extension**
   ```bash
   npm run build
   ```

5. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the `public` folder
   - The SpendGuard icon should appear in your extensions toolbar

### Development

```bash
# Watch mode for development
npm run dev

# Type checking
npm run type-check

# Production build
npm run build
```

---

## 🏗️ Architecture

### File Structure
```
src/
├── background/         # Chrome extension background script
├── content/           # Content script for intercepting checkouts
├── components/        # React components (CooldownTimer, etc.)
├── popup/            # Extension popup UI
├── utils/            # Utilities (storage, GPT client)
└── types/            # TypeScript type definitions
```

### Key Components

1. **Content Script** (`src/content/intercept.tsx`)
   - Detects checkout pages (Stripe, Shopify, Amazon, etc.)
   - Intercepts purchase buttons
   - Shows cooldown timer before allowing checkout

2. **Cooldown Timer** (`src/components/CooldownTimer.tsx`)
   - Full-screen modal with countdown
   - Reflection questions
   - "Proceed Anyway" option after minimum wait

3. **Storage Utilities** (`src/utils/storage.ts`)
   - Chrome storage API wrapper
   - Purchase tracking
   - Settings management

4. **GPT Client** (`src/utils/gptClient.ts`)
   - OpenAI API integration
   - Context-aware purchase nudges
   - Fallback to generic messages

5. **Popup Interface** (`src/popup/Popup.tsx`)
   - Purchase statistics
   - Recent purchase history
   - Settings configuration

---

## 🎯 Features

### ✅ Currently Implemented
- ⏳ Cooldown timers on checkout pages
- 📊 Purchase tracking and statistics
- 🔧 Configurable settings (cooldown duration, enable/disable features)
- 🎨 Modern UI with Tailwind CSS
- 🔒 Privacy-focused (all data stored locally)
- 🧠 AI-powered nudges (with OpenAI API key)

### 🔧 Supported Platforms
- Stripe checkout pages
- Shopify stores
- Amazon
- PayPal
- Generic checkout detection

---

## 💡 Philosophy

> “We don’t need more dashboards. We need intelligent friction at the moment of choice.”

SpendGuard doesn't block you. It helps you reflect, pause, and proceed with clarity—acting as a trusted guide for your browser life.

---

## 🧪 Roadmap

### Phase 1: Core Features ✅
- [x] MVP extension build
- [x] Smart intercept engine  
- [x] Purchase tracking and statistics
- [x] Configurable cooldown timers
- [x] Modern React + TypeScript architecture

### Phase 2: Enhanced Intelligence 🚧
- [ ] Advanced scam detection
- [ ] Price comparison integration
- [ ] Purchase pattern analysis
- [ ] Regret prediction model

### Phase 3: Personalization 🔮
- [ ] Machine learning for personal spending patterns
- [ ] Budget integration
- [ ] Category-based insights
- [ ] Social features (anonymous spending comparison)

---

## 🛡️ Privacy & Security

- **Local-first**: All data stored locally in Chrome storage
- **No tracking**: SpendGuard doesn't track your browsing
- **Optional AI**: GPT features require explicit API key configuration
- **Open source**: Full transparency in code and data handling

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenAI for GPT API
- Chrome Extensions team for Manifest V3
- React and TypeScript communities
- Tailwind CSS for beautiful styling


---

## 🙌 Contributors

Built by [Kanmi Obasa](https://kanmi.knfrmd.dev)  
Contributions welcome. Stay decisive.

---

## 🛡️ License

[MIT](./LICENSE)
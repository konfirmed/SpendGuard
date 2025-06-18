# SpendGuard 🛡️💡

**SpendGuard** is a lightweight browser companion that helps you make smarter, more intentional online purchase decisions. It adds intelligent friction at the moment of checkout, helping reduce impulse buys and promote mindful spending.

## ⚡ Performance First - 98% Smaller!

- **~25KB total** bundle size (vs ~1.4MB typical React extensions)
- **Zero framework dependencies** - pure TypeScript
- **Lightning fast** loading and execution
- **Ultra-lightweight** yet fully functional

---

## 🔍 What It Does

- ⏳ **Cooldown Before Checkout**: Adds a thoughtful pause (5s-5min) before purchases
- 📊 **Purchase Tracking**: Monitors your shopping activity and intercept statistics  
- 🎛️ **Configurable Settings**: Customize cooldown duration and toggle features
- 🛡️ **Smart Detection**: Automatically detects checkout flows across major platforms
- 🧠 **AI-Powered Nudges**: Optional intelligent insights using Chrome's built-in AI
- 🔒 **Privacy-First**: All data stored locally on your device, no external requests

---

## 🧑‍💻 Lightweight Tech Stack

- **Frontend**: Vanilla TypeScript (Chrome Extension, Manifest V3)
- **Bundle Size**: ~25KB total (content: 8KB, popup: 16KB, background: 1KB)
- **AI Layer**: Chrome's built-in AI APIs with intelligent fallbacks
- **Storage**: Chrome Storage API (local-first)
- **Build**: Webpack with TypeScript, minimal dependencies

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Chrome browser

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

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
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

# Bundle size analysis
npm run build:analyze
```

---

## 🏗️ Architecture

### File Structure (Lightweight)
```
src/
├── background/         # Service worker (~1KB)
├── content/           # Purchase interception (~8KB)
├── popup/            # Settings UI (~16KB)
├── types/            # TypeScript definitions
└── utils/            # Chrome AI utilities
```

### Key Components

1. **Content Script** (`src/content/lightweight-intercept.ts`)
   - Detects checkout buttons across major e-commerce platforms
   - Lightweight mutation observer for dynamic content
   - Minimal purchase context extraction

2. **Cooldown Modal** (Inline in content script)
   - Clean, accessible countdown interface
   - Reflection prompts to encourage thoughtful decisions
   - "Proceed" option after minimum wait time

3. **Popup Interface** (`src/popup/lightweight-popup.ts`)
   - Purchase statistics and recent activity
   - Settings configuration (cooldown duration, toggles)
   - Vanilla TypeScript with inline styles

4. **Background Service Worker** (`src/background/index.ts`)
   - Minimal message handling between content and popup
   - Storage management and data persistence
   - Extension lifecycle management

5. **Chrome AI Integration** (`src/utils/gptClient.ts`)
   - Uses Chrome's built-in AI when available
   - Intelligent fallbacks to generic nudges
   - Context-aware purchase insights

---

## 📊 Bundle Analysis

| Component | Size | Purpose |
|-----------|------|---------|
| **content.js** | 8.29 KB | Purchase interception & cooldown UI |
| **popup.js** | 15.8 KB | Settings interface & statistics |
| **background.js** | 984 bytes | Message handling & storage |
| **Total** | **~25 KB** | **Complete extension** |

**98.2% smaller** than typical React-based extensions!

---

## 🎯 Features

### ✅ Currently Implemented
- ⏳ Configurable cooldown timers (5 seconds to 5 minutes)
- 📊 Purchase tracking and interception statistics
- 🔧 Clean settings interface with toggles
- 🎨 Accessible UI with system fonts and semantic HTML
- 🔒 Privacy-focused (all data stored locally)
- 🧠 AI-powered nudges using Chrome's built-in capabilities

### 🔧 Supported Platforms
- **Generic Detection**: Smart button recognition across all sites
- **Major Platforms**: Stripe, Shopify, Amazon, PayPal, eBay, Etsy
- **E-commerce Frameworks**: WooCommerce, BigCommerce, Squarespace
- **Adaptive**: Continuously learns new checkout patterns

---

## 💡 Philosophy

> "We don't need heavy frameworks. We need intelligent friction at the moment of choice."

SpendGuard provides a gentle pause that helps you reflect before purchases, promoting mindful spending without being intrusive or resource-heavy.

---

## 🛡️ Privacy & Security

- **Local-first**: All data stored locally in Chrome storage
- **No tracking**: SpendGuard doesn't track your browsing habits
- **No external requests**: Everything runs locally in your browser
- **Optional AI**: Uses Chrome's built-in AI APIs only when available
- **Open source**: Full transparency in code and data handling

---

## 🧪 Performance Benefits

### Before (React + Tailwind):
- popup.js: 744 KB
- content.js: 686 KB  
- Total: ~1.4 MB

### After (Lightweight):
- popup.js: 15.8 KB
- content.js: 8.29 KB
- Total: ~25 KB

### Benefits:
- **Faster loading**: No framework overhead
- **Lower memory usage**: Minimal runtime footprint
- **Better UX**: Instant responsiveness  
- **Simpler maintenance**: Pure TypeScript, no build complexity

---

## 🛠️ Customization

The extension uses inline styles and vanilla TypeScript for maximum performance:

- **Cooldown styling**: Modify `showCooldown()` in `lightweight-intercept.ts`
- **Popup appearance**: Update `render()` methods in `lightweight-popup.ts` 
- **Detection rules**: Adjust selectors in checkout button detection
- **Timing**: Configure default cooldown values in settings

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines:
- Keep bundle size minimal - avoid adding new dependencies
- Use vanilla TypeScript over frameworks
- Inline styles instead of external CSS
- Test across major e-commerce platforms

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Chrome Extensions team for Manifest V3 and built-in AI APIs
- TypeScript community for excellent tooling
- E-commerce platforms for consistent checkout patterns

---

## 🙌 Contributors

Built by [Kanmi Obasa](https://www.linkedin.com/in/konfirmed)  
Contributions welcome. Stay lightweight, stay decisive.

---

*SpendGuard: Helping you pause and reflect before online purchases, one lightweight interaction at a time.*

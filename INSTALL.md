# WebAssistant Installation Guide

## Quick Setup (5 minutes)

### 1. Download or Clone
```bash
git clone <your-repo-url>
cd webassistant
```

### 2. Install & Build
```bash
npm install
npm run build
```

### 3. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Toggle "Developer mode" ON (top-right corner)
3. Click "Load unpacked"
4. Select the `public` folder from this project
5. You should see the WebAssistant icon in your toolbar!

### 4. Test It Out
1. Visit any Stripe demo checkout page
2. Try to click the "Pay" button
3. WebAssistant should show a cooldown timer
4. Click the extension icon to see your stats

## Optional: AI Features

If you want AI-powered purchase nudges:

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Copy `.env.example` to `.env.local`
3. Add your API key to `.env.local`
4. Rebuild: `npm run build`

## Troubleshooting

**Extension doesn't load?**
- Make sure you selected the `public` folder (not the project root)
- Check the Chrome Extensions page for error messages

**Cooldown doesn't appear?**
- Try a test checkout page like Stripe's demo
- Check browser console for any JavaScript errors
- Make sure the extension is enabled

**Need to update?**
- Run `npm run build` after making changes
- Click the refresh icon next to WebAssistant in `chrome://extensions/`

---

🎉 You're all set! WebAssistant will now help you make more thoughtful purchase decisions.

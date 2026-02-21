# Token Platform Switch

> Instantly navigate between crypto token platforms with automatic address transfer. One-click switching, no copy-pasting.

**Token Platform Switch** is an open-source Chrome extension that lets Solana token traders and analysts seamlessly jump between popular crypto platforms. It automatically extracts the token address from the current page and provides one-click navigation to view the same token on any supported platform.

## Supported Platforms

| Platform | Description |
|----------|-------------|
| [Pump.fun](https://pump.fun) | Token launch platform |
| [GMGN](https://gmgn.ai) | Token analytics & trading |
| [DexScreener](https://dexscreener.com) | DEX token screener |
| [Solscan](https://solscan.io) | Solana blockchain explorer |
| [Birdeye](https://birdeye.so) | Solana token analytics |
| [Raydium](https://raydium.io) | Solana AMM / DEX |
| [Jupiter](https://jup.ag) | Solana swap aggregator |
| [Bubblemaps](https://bubblemaps.io) | Token holder visualization |

## Features

- **Automatic Token Detection** - Extracts token addresses from URLs across all supported platforms
- **One-Click Navigation** - Switch between platforms instantly (Cmd/Ctrl+Click to open in a new tab)
- **Draggable Overlay** - Position the floating toolbar anywhere on the page; position persists across sites
- **Customizable Display** - Choose between Icons & Labels, Icons Only, or Labels Only modes
- **Platform Toggle** - Enable/disable individual platforms and reorder them via drag-and-drop
- **SPA Support** - Detects URL changes on single-page apps and updates automatically
- **Privacy-First** - No data collection, no analytics, no external servers
- **Zero Dependencies** - Pure vanilla JavaScript, no build step required

## Installation

### From Source (Developer Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/user/token-platform-switch.git
   cd token-platform-switch/chrome-extension
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `chrome-extension` directory
5. The extension is now active on all supported platforms

### From Chrome Web Store

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/token-platform-switch/glpalemkadimdlhobchgacallpffecnc).

You can also visit the website at [tokenplatformswitch.fun](https://tokenplatformswitch.fun).

## Usage

1. Navigate to any supported platform with a token page (e.g., `pump.fun/coin/<address>`)
2. A floating overlay appears with buttons for each enabled platform
3. Click a platform button to navigate to the same token on that platform
4. Hold **Cmd** (Mac) or **Ctrl** (Windows/Linux) and click to open in a new tab
5. Drag the overlay to reposition it anywhere on the screen
6. Click the **gear icon** to open settings and customize platforms, display mode, and order

## Project Structure

```
chrome-extension/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker
├── content.js          # Core logic: token extraction, overlay UI, settings
├── styles.css          # Glassmorphism-themed styles and animations
├── PRIVACY.md          # Privacy policy
├── icon16.png          # Extension icons
├── icon48.png
├── icon128.png
└── icons/              # Platform favicons
    ├── pump-favicon.ico
    ├── gmgn-favicon.ico
    ├── dex-favicon.ico
    ├── solscan-favicon.ico
    ├── birdeye-favicon.ico
    ├── raydium-favicon.ico
    ├── jupiter-favicon.ico
    └── bubblemaps-favicon.ico
```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make your changes** - no build step needed, just edit the source files
4. **Test locally** by loading the unpacked extension in Chrome
5. **Submit a Pull Request** with a clear description of your changes

### Ideas for Contributions

- Add support for new Solana platforms or other blockchain ecosystems
- Improve token address extraction for edge cases
- Add keyboard shortcuts
- Improve accessibility
- Localization / i18n support
- Write tests

### Guidelines

- Keep it simple - this project uses vanilla JavaScript with no build tools or frameworks
- Follow the existing code style
- Test your changes on multiple supported platforms before submitting
- Update this README if you add new platforms or features

## How It Works

1. **Content Script Injection** - `content.js` and `styles.css` are injected on all supported platform domains
2. **Token Extraction** - The extension parses the current page URL to extract the Solana token address using platform-specific patterns
3. **Overlay Rendering** - A floating overlay is created with navigation buttons for each enabled platform
4. **URL Building** - When a button is clicked, the extension constructs the correct URL for the target platform with the extracted token address
5. **SPA Handling** - A `MutationObserver` watches for URL changes on single-page apps and refreshes the overlay accordingly

## Tech Stack

- **JavaScript** (Vanilla ES6+)
- **CSS3** (Glassmorphism, animations, flexbox)
- **Chrome Extension Manifest V3**
- **Chrome Storage API** (sync)

## Privacy

This extension collects **zero** user data. All settings are stored locally via Chrome's built-in sync storage. No analytics, no tracking, no external server communication. See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## License

This project is open source. See the [LICENSE](LICENSE) file for details.

## Links

- Website: [tokenplatformswitch.fun](https://tokenplatformswitch.fun)
- Privacy Policy: [PRIVACY.md](PRIVACY.md)
- Contact: support@tokenplatformswitch.fun

# Catraz Guardian Extension

Catraz Guardian is a Manifest V3 browser extension that intercepts wallet transaction calls and requests a risk decision from the Catraz Risk Engine before execution.

## What It Intercepts

- `window.ethereum` (MetaMask-compatible providers)
  - detects and evaluates `eth_sendTransaction`
- `window.solana` (Phantom-compatible providers)
  - evaluates `request`, `sendTransaction`, `signAndSendTransaction` transaction paths

## Runtime Flow

1. Content script injects provider wrappers at page start.
2. Intercepted transaction requests are posted to the extension runtime.
3. Background service worker calls the Risk Engine API placeholder:
   - `https://risk-engine.catraz.local/v1/evaluate`
4. Risk decision is returned to the page interceptor.
5. Guardian applies action:
   - `ALLOW`: continue
   - `WARN`: continue + show warning UI
   - `BLOCK`: prevent transaction and throw provider error
   - `DELAY`: continue + show delay warning UI
6. Popup displays last risk assessment.

## Files

- `manifest.json`: MV3 extension config
- `background.js`: risk API client and decision persistence
- `content.js`: provider interception, preview, and warning overlay
- `popup.html` + `popup.js`: minimal UI for latest risk alert

## Local Install (Chrome)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` directory.

## Notes

- API endpoint is a placeholder; replace with deployed Catraz Risk Engine URL.
- Current UI is intentionally minimal and focused on actionable risk feedback.

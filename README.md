# Highlight Saver

A Chrome extension for saving text you highlight while reading, and
revisiting (or summarizing) it later from the toolbar.

## Features

- Select any text on any webpage → a small **"Save Highlight?"** button
  appears right under your selection.
- Click it and the highlight is saved locally (text, source URL, page
  title, timestamp) — no account, no server.
- Click the extension icon to open a popup listing every saved highlight,
  newest first, with the source site and a relative timestamp.
- **Delete** any highlight you no longer want.
- **Summarize** any highlight in one click using the OpenAI API (optional —
  requires your own API key, entered once in Settings and stored only in
  local browser storage).

## Install (load unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `highlight-saver` folder.
4. The highlighter icon will appear in your toolbar. Pin it for quick access.

## Using it

1. Go to any webpage and select some text.
2. Click the dark **"Save Highlight?"** pill that appears below your selection.
3. Click the toolbar icon any time to see your saved highlights.
4. To summarize a highlight:
   - Open the popup, click the gear icon, paste an OpenAI API key, click **Save**.
   - Click **Summarize** on any highlight card.

Your API key is stored with `chrome.storage.local` and is only ever sent
directly from your browser to `api.openai.com` — it never touches any
third-party server.

## File overview

| File            | Purpose                                              |
|-----------------|-------------------------------------------------------|
| `manifest.json` | Extension configuration (Manifest V3)                 |
| `content.js`    | Detects selections on the page, shows the save button |
| `content.css`   | Styling for the in-page button/toast                  |
| `background.js` | Service worker, initializes storage on install         |
| `popup.html`    | Markup for the toolbar popup                           |
| `popup.css`     | Popup styling                                          |
| `popup.js`      | Popup logic: render, delete, settings, summarize       |
| `icons/`        | Toolbar icons                                          |

## Notes / possible next steps

- Highlights are stored per-browser-profile via `chrome.storage.local`, so
  they won't sync across devices unless you switch to `chrome.storage.sync`
  (which has much smaller size limits).
- The summarize feature calls OpenAI's `gpt-4o-mini` model by default — edit
  the `model` field in `popup.js` (`requestSummary`) to change it.
- There's no in-page re-highlighting of saved text on return visits (i.e. it
  doesn't repaint your old highlights on the original page) — it's a save/
  review list, not a page annotator. That'd be a natural next feature.

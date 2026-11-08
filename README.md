# X Home Position Restorer

A userscript that remembers your place on the X (Twitter) Home timeline and lets you jump back to it.

When you scroll on the Home feed and then open a post, go to Notifications, Chat, or anywhere else, X often dumps you far away from where you were when you return. This script snapshots your position **only when you leave Home**, then gives you a button (and an optional Auto mode) to restore it.

## Features

- **Snapshot on leave** — Tracks the top visible tweet while you’re on Home, but only saves the position when you navigate away. Scrolling around on Home itself does not overwrite the saved spot.
- **Restore button** — Floating button (bottom-left) that scrolls you back to the saved tweet and viewport offset.
- **Auto mode** — Toggle next to the button. When enabled, the script automatically tries to restore your position when you return to Home (e.g. after hitting the browser Back button).
- **Works on desktop and mobile** — Floating button avoids covering the compose button on mobile.
- **Cancellable** — Press Esc, scroll, or touch during restore to cancel immediately.
- **Visual feedback** — Briefly highlights the restored tweet.
- **Privacy-friendly** — Everything stays in the current tab’s `sessionStorage`. No network requests, no accounts, no tracking.

## Installation

1. Install a userscript manager:
   - **Chrome / Edge / Brave**: [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or Violentmonkey
   - **Firefox**: Tampermonkey or Violentmonkey
   - **Firefox Mobile**: Userscripts extension
   - **Safari**: Userscripts app
2. Click the install link below (or open the raw `.user.js` file):

   **[Install X Home Position Restorer](https://github.com/DarkestPhoenix/x-home-position-restorer/raw/refs/heads/main/X-Home-Position-Restorer.user.js)**

3. Confirm the install in your userscript manager.
4. Reload any open X tabs.

## Usage

1. Go to the Home timeline and scroll to where you want to remember.
2. Navigate away (open a post, go to Notifications, Chat, a profile, etc.). The script snapshots your position at that moment.
3. Return to Home.
4. Tap/click the blue **Restore** button (bottom-left) to jump back.
5. Optionally enable the **Auto** checkbox so it restores automatically when you return to Home.

The button shows “…” while restoring. You can cancel at any time with Esc or by scrolling.

## Notes

- Position is stored per browser tab and cleared when the tab is closed.
- Restore looks for the exact tweet ID. If the tweet has been removed or is extremely far away, it may not find it after a reasonable number of attempts.
- X’s timeline is virtualized, so the script scrolls in steps while searching. This is normal.
- The script only tracks and restores the main Home timeline (`/home` or `/`).

## License

MIT

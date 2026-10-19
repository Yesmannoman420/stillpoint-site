# stillpointdarts.com

The public website: landing page (`index.html`), guide (`guide.html`), privacy policy (`privacy.html`) and the live demo (`live/`). Plain HTML and one stylesheet; no build step, no external requests (no web fonts, analytics or trackers), so the privacy policy's promise for the site holds.

Preview locally by opening `index.html`, or capture the pages with headless Edge (see `tools/bigscreen_preview.py` for the capture pattern).

The privacy policy describes the app as implemented (on-device data, transient camera frames, encrypted companion link, read-only local big screen, optional account fields, Google sign-in scopes, Resend for account email, export and deletion in the app). Keep it in step with the app; the date at the top changes with every edit.

Not deployed. Publishing needs a host (any static host works) and DNS for `stillpointdarts.com`; the domain's Resend records (`send`, `resend._domainkey`, `_dmarc`) must stay as they are. The Google OAuth consent screen can use `https://stillpointdarts.com/` as the homepage and `https://stillpointdarts.com/privacy.html` as the privacy policy once the site is live.

## Live demo

`live/index.html` is a copy of the app's big-screen page (`app/src/main/assets/bigscreen/index.html`); `live/?demo` loads `live/demo.js`, which plays a simulated club night (an eight-player knockout with the semi-final and final shown dart by dart) through the page's own rendering. The landing page embeds it in the Big screen section. After changing the app's page, run `python tools/sync_live_page.py`; CI fails while the copy is stale. `live/?demo&fast` runs the night at about four times the speed, for checks.

Brand files: `assets/mark-dark.svg` is the target-and-dart mark for dark grounds, `assets/icon.svg` the favicon (the launcher icon), `assets/share.jpg` the 1200×630 link preview. Sources are in `brand/`.

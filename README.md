# stillpointdarts.com

The public website: landing page (`index.html`), guide (`guide.html`), privacy policy (`privacy.html`) and the live demo (`live/`). Plain HTML and one stylesheet; no build step, no external requests (no web fonts, analytics or trackers), so the privacy policy's promise for the site holds.

Preview locally by opening `index.html`, or capture the pages with headless Edge (see `tools/bigscreen_preview.py` for the capture pattern).

The privacy policy describes the app as implemented (on-device data, transient camera frames, encrypted companion link, read-only local big screen, optional account fields, Google sign-in scopes, Resend for account email, export and deletion in the app). Keep it in step with the app; the date at the top changes with every edit.

Published at https://stillpointdarts.com from the public repo `Yesmannoman420/stillpoint-site` (GitHub Pages, `main` branch root, with `CNAME` and `.nojekyll`). DNS at Namecheap: four A records on `@` (185.199.108–111.153) and CNAME `www` to `yesmannoman420.github.io`. The domain's Resend records (`send`, `rsend`, `resend._domainkey`, `_dmarc`) must stay as they are. To publish a change, run `python3 tools/publish_site.py` from a checkout that has the site repo cloned beside it. The Google OAuth consent screen can use `https://stillpointdarts.com/` as the homepage and `https://stillpointdarts.com/privacy.html` as the privacy policy.

The Cast receiver is `https://stillpointdarts.com/live/?cast`, registered in the Google Cast developer console as the custom receiver "Still Point Live" (app ID `D49F630E`, the default in `app/build.gradle`). Until it is published there, it only launches on Cast devices registered in that console.

## Live demo

`live/index.html` is a copy of the app's big-screen page (`app/src/main/assets/bigscreen/index.html`); `live/?demo` loads `live/demo.js`, which plays a simulated club night (an eight-player knockout with the semi-final and final shown dart by dart) through the page's own rendering. The landing page embeds it in the Big screen section. After changing the app's page, run `python tools/sync_live_page.py`; CI fails while the copy is stale. `live/?demo&fast` runs the night at about four times the speed, for checks.

## Home page

`index.html` with `assets/home.css` (the guide and privacy pages keep `assets/site.css`). It follows the "product performs" direction: the hero is a working dartboard that scores taps the way the app does (double out, busts, and the app's own checkout routes, exported from `core/CheckoutRoutes` with a one-off Java program and inlined, so re-export them when the routes change); the screens row uses real app screenshots (`assets/app-*.webp`, captured on the emulator in English); the TV and phone sections embed `live/?demo` and `live/?demo&pocket`; the Look control reloads the TV demo with `&theme=`. Photographs are open-licence archive pictures, credited in the footer and listed with their sources in `assets/credits.json` (Klaus D. Peter, CC BY 3.0; Willem van de Poll, Nationaal Archief, CC0). Nothing is loaded from another site. Check it with the taste skill's `inspect.mjs` at 1440, 768 and 390.

Brand files: `assets/mark-dark.svg` is the target-and-dart mark for dark grounds, `assets/icon.svg` the favicon (the launcher icon), `assets/share.jpg` the 1200×630 link preview. Sources are in `brand/`.

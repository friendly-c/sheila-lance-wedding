# All the Love Club — wedding website prototype

A mobile-first, scrapbook-inspired wedding website built with plain HTML, CSS and vanilla JavaScript. It has no build step, package manager, paid service, external font, external image service or third-party runtime dependency.

> **Prototype content:** Sheila, Lance, the venue, timetable, travel notes, invitation names and RSVP tokens are fictional sample content. Update these before publishing a real wedding site. The RSVP page does not connect to Google Sheets or Google Apps Script.

## What's included

```text
wedding-website-prototype/
├── index.html                 # Home, welcome and live countdown
├── details.html               # Schedule, venue placeholder and dress code
├── travel.html                # Transport, parking and accommodation placeholders
├── faqs.html                  # Keyboard-accessible native FAQ accordions
├── rsvp.html                  # Personalised mock invitation and form
├── README.md
├── .nojekyll                  # Tells GitHub Pages not to process the folder with Jekyll
└── assets/
    ├── css/
    │   └── styles.css          # Shared responsive styling and reduced-motion rules
    ├── images/
    │   ├── flower-doodle.svg
    │   ├── hero-couple.svg
    │   ├── map-scribble.svg
    │   ├── rings-doodle.svg
    │   └── sun-scribble.svg
    └── js/
        ├── site-config.js      # Shared couple/date/venue settings
        ├── site.js             # Responsive nav, shared content and countdown
        ├── mock-invitations.js # Fictional invitation data only
        ├── rsvp-adapter.js     # Isolated mock RSVP data boundary
        └── rsvp.js             # RSVP page rendering, validation and confirmation
```

## Preview locally

Because the scripts use native JavaScript modules, preview the files through a local HTTP server rather than opening an HTML file directly with `file://`.

1. Open a terminal in this project folder.
2. Run:

   ```bash
   python -m http.server 8000
   ```

3. Visit [http://localhost:8000](http://localhost:8000).
4. Stop the server with `Ctrl+C` when finished.

Alternatively, use the Live Server extension in Visual Studio Code.

## Test the RSVP prototype

Use one of the following sample invitation links while the local server is running:

- `http://localhost:8000/rsvp.html?invite=demo-olive-finch` — Olive and Noah Finch (two guests)
- `http://localhost:8000/rsvp.html?invite=demo-river-james` — River James (one guest)
- `http://localhost:8000/rsvp.html?invite=demo-morgan-park` — Morgan and Taylor Park (two guests)

The `invite` query parameter selects a record in `assets/js/mock-invitations.js`. You can also use `?token=`; both query names are accepted. An absent or unknown token produces an error state with the sample links.

Each guest must choose whether they will attend. A meal choice becomes required only when that guest answers yes. The form also accepts optional dietary/access notes. Submission shows a mock confirmation and locks that invitation in the same browser using `localStorage`.

To test again after submitting, clear that token's key from the browser's local storage. The key format is `wedding-rsvp-prototype:<token>`, for example `wedding-rsvp-prototype:demo-olive-finch`. The lock is a prototype convenience, not a production security control. Browser storage can be cleared or disabled; the page explains that limitation if storage is unavailable.

## Publish on GitHub Pages

1. Create a new GitHub repository for the website. For example, `our-wedding`.
2. Upload the contents of this folder to the repository root (so `index.html` is in the root, not inside an extra nested folder).
3. Commit and push the files to the `main` branch.
4. Open the repository's **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch `main` and folder `/(root)`, then save.
7. Wait for GitHub Pages to finish its deployment and open the URL shown on that settings page.

All page links, scripts, styles and local SVG references use relative paths (for example, `./assets/css/styles.css`), so they also work when GitHub Pages hosts the site at a project URL such as `https://username.github.io/our-wedding/`.

## Customise the site

- **Couple, date and venue:** edit `assets/js/site-config.js`. Change `dateISO` to an ISO-8601 date/time with the correct local time-zone offset; it drives the countdown.
- **Page text and schedule:** edit the relevant `.html` page. Replace placeholder schedule, dress-code, travel, accessibility and FAQ details with confirmed information.
- **Colours, layouts and type:** edit the CSS variables at the top of `assets/css/styles.css`. The type stack uses system fonts only.
- **Artwork and placeholder imagery:** replace the SVGs in `assets/images/` with your own optimised local images, retaining filenames or updating their references in the HTML/CSS. The SVG artwork is editable text-based source, not an external service.
- **Invitation samples:** edit `assets/js/mock-invitations.js`. Keep it fictional until the real RSVP integration is built; don't publish a real guest list or private guest data to a public repository.

## RSVP integration boundary

`assets/js/rsvp.js` imports only `loadInvitation()` and `submitRsvp()` from `assets/js/rsvp-adapter.js`. That is the intended seam for future integration. The current adapter imports fictional records, makes no network calls and stores mock submissions in the visitor's own browser.

When integrating Google Apps Script:

1. Replace the mock functions in `rsvp-adapter.js` with calls to the deployed Apps Script web app. Keep the two exported function names and result shapes, or update the RSVP UI to match the server responses.
2. Store the invitation-token-to-guest mapping in the private spreadsheet/server-side data layer, not in the public JavaScript bundle.
3. Generate unique, opaque, high-entropy invitation tokens and validate each token server-side before returning guest names.
4. Validate the guest IDs, attendance values, meal options and note lengths server-side. Do not trust client-side form checks.
5. Enforce the one-submission lock on the server as well as in the interface; local storage alone is not secure or authoritative.
6. Return only data needed for the invitation and a safe confirmation reference. Do not expose spreadsheet IDs, credentials, API secrets or private guest records in client-side code.
7. Test the web app deployment, permissions, cross-origin behaviour and failure modes from the published GitHub Pages origin before using it with guests.

No real endpoint, spreadsheet ID, credential, API secret or production guest data is included in this prototype.

## Accessibility and browser behaviour

- The mobile navigation button reports its expanded state and controls the navigation region.
- Every page has a skip link, semantic landmarks, visible keyboard focus and meaningful labels.
- FAQ items use native `<details>` and `<summary>` controls.
- RSVP fields use fieldsets/legends, required attendance choices, conditional required meal inputs and announced status/confirmation regions.
- The CSS honours `prefers-reduced-motion` and avoids external fonts or remotely loaded images.
- A recent browser with JavaScript modules, CSS grid and `localStorage` enabled is recommended for the full prototype experience. Content navigation remains ordinary HTML links.

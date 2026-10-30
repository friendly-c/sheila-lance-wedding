# Sheila & Lance — wedding website

A mobile-first, botanical invitation-inspired wedding website built with plain HTML, CSS and vanilla JavaScript. It has no build step, package manager, paid service, external font, external image service or third-party runtime dependency.

> **Content status:** The venue and core travel details are confirmed for The Mill at Elstead. Public transport is limited, so guests should check operator timetables nearer the date and arrange their own return journey. Other page content, including contact and menu details, may still need the couple's review. The live RSVP page is configured to use Google Apps Script; it validates unique invitation tokens and records responses in the private Google Sheet. Sample invitation links on the RSVP error state are available only in mock mode. Production guest links come from the private `Invitations` sheet.

## What's included

```text
wedding-website-prototype/
├── index.html                 # Home, welcome and live countdown
├── details.html               # Schedule, confirmed venue details and dress code
├── travel.html                # Confirmed directions, parking and transport guidance
├── faqs.html                  # Keyboard-accessible native FAQ accordions
├── rsvp.html                  # Personalised full-day / evening RSVP form
├── README.md
├── .nojekyll                  # Tells GitHub Pages not to process the folder with Jekyll
└── assets/
    ├── css/
    │   └── styles.css          # Shared responsive styling and reduced-motion rules
    ├── images/
    │   ├── flower-doodle.svg
    │   ├── hero-couple.svg
    │   ├── botanical-spray.svg
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

## Test mock RSVP locally

For local interface testing, set `mode: "mock"` in `assets/js/rsvp-config.js` and use one of the following sample invitation links while the local server is running. Do not use these example tokens in the deployed live site:

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
- **Colours, layouts and type:** edit the CSS variables at the top of `assets/css/styles.css`. The invitation-inspired design uses system serif fonts and local botanical SVG artwork.
- **Artwork and photography:** replace the SVGs in `assets/images/` with your own optimised local images, retaining filenames or updating their references in the HTML/CSS. The homepage and travel page use a photograph hosted by The Mill at Elstead's official website. The botanical decoration is editable local SVG artwork.
- **Invitation samples:** edit `assets/js/mock-invitations.js`. Keep it fictional until the real RSVP integration is built; don't publish a real guest list or private guest data to a public repository.

## Live RSVP and spreadsheet integration

The RSVP page imports `loadInvitation()` and `submitRsvp()` from `assets/js/rsvp-adapter.js`. The adapter supports both local mock mode and the deployed Apps Script backend. Keep the public `assets/js/rsvp-config.js` endpoint URL current and never place credentials or spreadsheet IDs in the public bundle.

The private Google Sheet is the source of truth for invitations, invited guests, guest types, menu options, submissions and individual responses. Full-day invitations collect attendance and (for each attending guest) starter, main and dessert choices. Evening-only invitations collect attendance only. The backend validates invitation tokens, guest membership, course eligibility and the one-submission lock.

### Adult and child menus

Each guest has a `guest_type` of `ADULT` or `CHILD` in the private `Guests` tab. Each row in `Meal Options` has a course (`starter`, `main`, `dessert`) and a guest type: `ADULT`, `CHILD` or `ALL`. Each `meal_code` should be unique. The frontend filters choices for each guest, and Apps Script validates the selection independently. Existing guest and meal option rows are migrated to `ADULT`; review the private sheet and set child rows and child meal options before sending real invitations.

To test the UI locally, use `rsvp.html?invite=demo-family-with-child` in mock mode. The child meal labels in the public mock records are examples only and are not used by the live backend.

For backend deployment and spreadsheet schema details, use the accompanying children-menu backend upgrade instructions. Re-run the backend setup migration only after backing up the sheet, and keep the site out of use while coordinating website and backend changes.

## Accessibility and browser behaviour

- The mobile navigation button reports its expanded state and controls the navigation region.
- Every page has a skip link, semantic landmarks, visible keyboard focus and meaningful labels.
- FAQ items use native `<details>` and `<summary>` controls.
- RSVP fields use fieldsets/legends, required attendance choices, conditional required meal inputs and announced status/confirmation regions.
- The CSS honours `prefers-reduced-motion` and avoids external fonts or remotely loaded images.
- A recent browser with JavaScript modules, CSS grid and `localStorage` enabled is recommended for the full prototype experience. Content navigation remains ordinary HTML links.




The visual system follows the couple's botanical invitation: ivory paper, deep burgundy, antique gold, restrained serif typography and botanical corner motifs. The home countdown is a full-width band, the running order is an editorial timeline, the venue photograph is the Getting here masthead, and the RSVP form sits inside an invitation panel.
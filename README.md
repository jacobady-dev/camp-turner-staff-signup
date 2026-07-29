# Camp Turner Staff Signup

This version restores the streamlined first prototype while keeping the newer shared-roster structure.

## Player flow

1. Confirm attendance and enter a name.
2. Review the Camp Turner overview.
3. Select an available opening-crew assignment.
4. Confirm the role.
5. The role is reserved in the shared roster.
6. Receive a digital confirmation.

## Preview mode

Open `index.html`. Without Firebase credentials, the site runs in local demo mode and stores the roster in the current browser.

## Shared live roster

1. Create a Firebase project.
2. Enable Firestore Database.
3. Register a web app.
4. Paste the Firebase configuration into `firebase-config.js`.
5. Publish these files through GitHub Pages.
6. Apply `firestore.rules` in Firebase.

GitHub Pages hosts the site. Firestore stores the shared assignments and prevents two players from claiming the same role.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `firebase-config.js`
- `firestore.rules`

## Visual revision

This version keeps the streamlined first-prototype layout but changes the visual system to a classic Windows 95/98 personal-site style: light gray interface chrome, white content panels, dark blue title bars, purple serif headings, and bitmap/monospace accents.

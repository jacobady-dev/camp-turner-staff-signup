# Camp Turner Firebase Setup

The website code is ready for a shared Firestore roster. Complete these steps in the Firebase Console.

## 1. Create the project

1. Create a Firebase project.
2. Add a Web App to the project.
3. Copy the Firebase configuration object shown for that Web App.

## 2. Enable Firestore

1. Open **Build > Firestore Database**.
2. Create the database.
3. Choose a region near the players.
4. Open the **Rules** tab.
5. Replace the rules with the contents of `firestore.rules` from this repository.
6. Click **Publish**.

## 3. Enable anonymous authentication

1. Open **Build > Authentication**.
2. Click **Get started** if prompted.
3. Open **Sign-in method**.
4. Enable **Anonymous**.

Anonymous authentication gives each browser a private Firebase user ID. This lets a player release their own role without allowing them to release somebody else's.

## 4. Add the web configuration

Open `firebase-config.js` and replace the placeholder values with the Firebase Web App configuration.

Then change:

```js
export const useSharedDatabase = false;
```

to:

```js
export const useSharedDatabase = true;
```

The Firebase Web App configuration is intended to be included in browser code. Access control is handled by Firestore rules, not by hiding this configuration.

## 5. Test the roster

1. Open the website in one browser.
2. Claim a role.
3. Open the website in a private/incognito window or another device.
4. Confirm that the first role displays as claimed.
5. Claim a different role in the second browser.
6. Confirm that neither browser can overwrite the other player's role.
7. Confirm that each browser can release only its own role.

## Firestore collection

The site creates documents inside:

```text
campTurnerRoles/{roleId}
```

Each claimed role contains:

```text
name
roleTitle
claimedByUid
claimedAt
```

No character statistics, gear, Hindrances, Edges, or camp work assignments are stored or displayed by the signup site.

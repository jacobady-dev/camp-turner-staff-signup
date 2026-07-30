import { firebaseConfig, useSharedDatabase } from "./firebase-config.js";

const playerKey = "campTurnerPlayerV2";
let db = null;
let auth = null;
let currentUser = null;
let ready = false;

async function setupPlayerRecords() {
  const configured = useSharedDatabase && firebaseConfig?.apiKey && !firebaseConfig.apiKey.includes("PASTE_");
  if (!configured) return;

  try {
    const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const { getAuth, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    currentUser = auth.currentUser || (await signInAnonymously(auth)).user;
    ready = true;

    const player = getSessionPlayer();
    if (player?.name) await savePlayer({ includeConfirmation: true });
  } catch (error) {
    console.error("Camp Turner player record setup failed:", error);
  }
}

function getSessionPlayer() {
  try {
    return JSON.parse(sessionStorage.getItem(playerKey) || "null");
  } catch {
    return null;
  }
}

async function savePlayer({ includeConfirmation = false, includeClaim = false, scareViewed = false, released = false } = {}) {
  if (!ready || !db || !currentUser) return;
  const player = getSessionPlayer();
  if (!player?.name) return;

  const { doc, setDoc, serverTimestamp, Timestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const data = {
    playerName: player.name,
    attendanceStatus: "confirmed",
    anonymousUid: currentUser.uid,
    updatedAt: serverTimestamp()
  };

  if (includeConfirmation && player.confirmedAt) {
    data.confirmedAt = Timestamp.fromDate(new Date(player.confirmedAt));
  }

  if (includeClaim && player.roleId) {
    const roleTitle = document.getElementById("complete-role")?.textContent?.trim() || null;
    data.roleId = player.roleId;
    data.roleTitle = roleTitle;
    data.claimedAt = serverTimestamp();
    data.roleReleasedAt = null;
  }

  if (scareViewed) data.scareViewedAt = serverTimestamp();

  if (released) {
    data.roleId = null;
    data.roleTitle = null;
    data.roleReleasedAt = serverTimestamp();
  }

  await setDoc(doc(db, "campTurnerPlayers", currentUser.uid), data, { merge: true });
}

const confirmForm = document.getElementById("confirm-form");
confirmForm?.addEventListener("submit", () => {
  window.setTimeout(() => savePlayer({ includeConfirmation: true }), 250);
});

const approveButton = document.getElementById("approve-dialog");
approveButton?.addEventListener("click", () => {
  let attempts = 0;
  const checkClaim = window.setInterval(() => {
    attempts += 1;
    const player = getSessionPlayer();
    if (player?.roleId) {
      window.clearInterval(checkClaim);
      savePlayer({ includeClaim: true });
    } else if (attempts >= 20) {
      window.clearInterval(checkClaim);
    }
  }, 250);
});

const changeButton = document.getElementById("change-assignment");
changeButton?.addEventListener("click", () => {
  window.setTimeout(() => {
    const player = getSessionPlayer();
    if (player?.name && !player.roleId) savePlayer({ released: true });
  }, 800);
});

const overlay = document.getElementById("death-overlay");
if (overlay) {
  let scareRecorded = false;
  const observer = new MutationObserver(() => {
    if (!scareRecorded && overlay.classList.contains("corrupted")) {
      scareRecorded = true;
      savePlayer({ scareViewed: true });
    }
    if (!overlay.classList.contains("active")) scareRecorded = false;
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });
}

setupPlayerRecords();

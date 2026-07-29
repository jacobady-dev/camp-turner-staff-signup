import { firebaseConfig } from "./firebase-config.js";

const roles = [
  { id:"girls-cabins", code:"CABIN-F", title:"Girls’ Cabin Crew", location:"Azalea & Holly Cabins", description:"Sweep bunks, clean lockers, check showers and make both flower cabins ready for opening day." },
  { id:"boys-cabins", code:"CABIN-M", title:"Boys’ Cabin Crew", location:"Beech & Birch Cabins", description:"Dust bunks, inspect lockers, clean washrooms and prepare both tree cabins for incoming campers." },
  { id:"grounds", code:"GROUND-1", title:"Grounds & Flagpole Crew", location:"Central Camp Clearing", description:"Clear the circular drive and courtyard of branches, stones and thirteen years of accumulated debris." },
  { id:"firewood", code:"WOOD-2", title:"Firewood Crew", location:"Camp Woods", description:"Gather and stack enough firewood for the welcome campfire. Please remain with your assigned partner." },
  { id:"dining", code:"MESS-4", title:"Dining Hall & Kitchen Crew", location:"Main Building", description:"Clean and repair the dining hall and kitchen. Check the pantry, appliances and camp telephone." },
  { id:"dock", code:"LAKE-6", title:"Dock & Boathouse Crew", location:"Shady Lake", description:"Scrub the dock, clean the small dock house, and stock oars and life vests for water activities." }
];

const localKey = "campTurnerSharedDemoRosterV1";
const playerKey = "campTurnerPlayerV1";

let currentPlayer = JSON.parse(sessionStorage.getItem(playerKey) || "null");
let selectedRole = null;
let roster = {};
let db = null;
let useFirebase = false;

const screens = {
  confirm: document.getElementById("screen-confirm"),
  about: document.getElementById("screen-about"),
  volunteer: document.getElementById("screen-volunteer"),
  confirmation: document.getElementById("screen-confirmation")
};

function showScreen(name){
  if ((name === "volunteer" || name === "confirmation") && !currentPlayer) {
    name = "confirm";
  }
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle("active", key === name));
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll("[data-nav]").forEach(button => {
  button.addEventListener("click", () => showScreen(button.dataset.nav));
});

document.getElementById("confirm-form").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("player-name").value.trim();
  const attendance = document.getElementById("attendance").value;
  const acknowledge = document.getElementById("acknowledge").checked;

  if (!name || !attendance || !acknowledge) {
    flash("confirm-notice", "PLEASE COMPLETE EVERY FIELD.");
    return;
  }

  if (attendance !== "confirmed") {
    flash("confirm-notice", "ATTENDANCE DECLINED. YOUR RECORD HAS NOT BEEN ADDED.");
    return;
  }

  currentPlayer = { name, confirmedAt:new Date().toISOString() };
  sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
  document.getElementById("identity-name").textContent = name.toUpperCase();
  showScreen("about");
});

function renderRoles(){
  const grid = document.getElementById("role-grid");
  grid.innerHTML = "";

  roles.forEach(role => {
    const claim = roster[role.id];
    const card = document.createElement("article");
    card.className = "role-card";
    if (claim) card.classList.add("taken");
    if (selectedRole === role.id) card.classList.add("selected");

    card.innerHTML = `
      <span class="role-availability">${claim ? "POSITION FILLED" : "AVAILABLE"}</span>
      <span class="role-code">${role.code}</span>
      <h3>${role.title}</h3>
      <div class="role-location">${role.location}</div>
      <p>${role.description}</p>
      ${claim ? `<small><b>Claimed by:</b> ${escapeHtml(claim.name)}</small>` : ""}
    `;

    card.addEventListener("click", () => {
      if (claim) return;
      selectedRole = role.id;
      document.getElementById("confirm-role").disabled = false;
      renderRoles();
    });

    grid.appendChild(card);
  });
}

document.getElementById("confirm-role").addEventListener("click", () => {
  if (!selectedRole || !currentPlayer) return;
  const role = roles.find(r => r.id === selectedRole);
  document.getElementById("dialog-copy").textContent =
    `${currentPlayer.name}, reserve ${role.title} at ${role.location}?`;
  document.getElementById("confirm-dialog").showModal();
});

document.getElementById("cancel-dialog").addEventListener("click", () => {
  document.getElementById("confirm-dialog").close();
});

document.getElementById("approve-dialog").addEventListener("click", async () => {
  document.getElementById("confirm-dialog").close();
  if (!selectedRole || !currentPlayer) return;

  const role = roles.find(r => r.id === selectedRole);

  try {
    if (useFirebase) {
      await claimFirebaseRole(role);
    } else {
      const latest = JSON.parse(localStorage.getItem(localKey) || "{}");
      if (latest[role.id]) throw new Error("That assignment was just claimed.");
      latest[role.id] = {name:currentPlayer.name, claimedAt:new Date().toISOString()};
      localStorage.setItem(localKey, JSON.stringify(latest));
      roster = latest;
    }

    currentPlayer.roleId = role.id;
    sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
    populateConfirmation(role);
    selectedRole = null;
    renderRoles();
    document.getElementById("page").classList.add("glitch");
    setTimeout(() => document.getElementById("page").classList.remove("glitch"), 900);
    showScreen("confirmation");
  } catch (error) {
    flash("role-notice", error.message || "THAT POSITION COULD NOT BE RESERVED.");
    await refreshRoster();
  }
});

function populateConfirmation(role){
  document.getElementById("complete-name").textContent = currentPlayer.name.toUpperCase();
  document.getElementById("complete-role").textContent = role.title;
  document.getElementById("complete-location").textContent = role.location;
}

document.getElementById("copy-confirmation").addEventListener("click", async () => {
  if (!currentPlayer?.roleId) return;
  const role = roles.find(r => r.id === currentPlayer.roleId);
  const text = `CAMP TURNER SUMMER STAFF '85\nCounselor: ${currentPlayer.name}\nAssignment: ${role.title}\nLocation: ${role.location}\nStatus: Reserved`;
  await navigator.clipboard.writeText(text);
  flash("complete-notice", "CONFIRMATION COPIED TO CLIPBOARD.");
});

document.getElementById("change-assignment").addEventListener("click", async () => {
  if (!currentPlayer?.roleId) return;

  const roleId = currentPlayer.roleId;

  try {
    if (useFirebase) {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      await deleteDoc(doc(db, "campTurnerAssignments", roleId));
    } else {
      const latest = JSON.parse(localStorage.getItem(localKey) || "{}");
      delete latest[roleId];
      localStorage.setItem(localKey, JSON.stringify(latest));
      roster = latest;
    }

    delete currentPlayer.roleId;
    sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
    await refreshRoster();
    showScreen("volunteer");
  } catch {
    flash("complete-notice", "THE ASSIGNMENT COULD NOT BE RELEASED.");
  }
});

async function setupDatabase(){
  const configured =
    firebaseConfig &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("PASTE_");

  if (!configured) {
    useFirebase = false;
    document.getElementById("database-mode").textContent = "LOCAL DEMO";
    roster = JSON.parse(localStorage.getItem(localKey) || "{}");
    renderRoles();
    return;
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore, collection, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useFirebase = true;
    document.getElementById("database-mode").textContent = "LIVE SHARED";

    onSnapshot(collection(db, "campTurnerAssignments"), snapshot => {
      roster = {};
      snapshot.forEach(docSnap => roster[docSnap.id] = docSnap.data());
      renderRoles();
    });
  } catch (error) {
    console.error(error);
    useFirebase = false;
    document.getElementById("database-mode").textContent = "LOCAL FALLBACK";
    roster = JSON.parse(localStorage.getItem(localKey) || "{}");
    renderRoles();
  }
}

async function claimFirebaseRole(role){
  const { doc, runTransaction, serverTimestamp } =
    await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

  const roleRef = doc(db, "campTurnerAssignments", role.id);

  await runTransaction(db, async transaction => {
    const roleDoc = await transaction.get(roleRef);
    if (roleDoc.exists()) throw new Error("That assignment was just claimed.");

    transaction.set(roleRef, {
      name: currentPlayer.name,
      roleTitle: role.title,
      location: role.location,
      claimedAt: serverTimestamp()
    });
  });
}

async function refreshRoster(){
  if (!useFirebase) {
    roster = JSON.parse(localStorage.getItem(localKey) || "{}");
    renderRoles();
  }
}

function flash(id, message){
  const el = document.getElementById(id);
  el.textContent = "> " + message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 5000);
}

function escapeHtml(value){
  return value.replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function visitorCounter(){
  const key = "campTurnerVisits";
  const visits = Number(localStorage.getItem(key) || 1984) + 1;
  localStorage.setItem(key, visits);
  document.getElementById("counter").textContent = String(visits).padStart(6,"0");
}

if (currentPlayer) {
  document.getElementById("identity-name").textContent = currentPlayer.name.toUpperCase();
  if (currentPlayer.roleId) {
    const role = roles.find(r => r.id === currentPlayer.roleId);
    if (role) populateConfirmation(role);
  }
}

visitorCounter();
setupDatabase();
renderRoles();

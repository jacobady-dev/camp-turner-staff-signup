import { firebaseConfig, useSharedDatabase } from "./firebase-config.js";

const roles = [
  { id:"jock", title:"The Jock", description:"Whether you were the high school quarterback, soccer star, or power forward, you were the best athlete at your high school. You are adored by students and staff alike." },
  { id:"brain", title:"The Brain", description:"You were the school Valedictorian and got a perfect score on the SATs. That kind of dedication means you sacrificed a lot for your grades. You never went to parties and barely anyone remembers your name." },
  { id:"basket-case", title:"The Basket Case", description:"You’re the outcast, the one in the back of the classroom no one notices. You might have one good friend you talk to, but you stick to your family. Most people are lame anyway." },
  { id:"princess-prince", title:"The Princess / Prince", description:"Homecoming King/Queen, Class President, head of the Yearbook Committee—you went to every party and were always the center of attention, even if it meant making fun of someone around you." },
  { id:"criminal", title:"The Criminal", description:"You grew up on the wrong side of the tracks and did what you had to do to get by. The popular kids have never had to earn anything, so taking stuff from them is justice, not a crime." },
  { id:"clown", title:"The Clown", description:"You’ve never been the best looking, and you’re a bit overweight, but you found early that your sense of humor can get everyone’s attention. You mostly make fun of yourself for fear of getting beat up." },
  { id:"cheerleader", title:"The Cheerleader", description:"Cheerleading is hard. No one understands how hard cheerleading really is. You try getting thrown ten feet in the air and then hope the people on the ground catch you." },
  { id:"gearhead", title:"The Gearhead", description:"Your first memory is that of your father and uncles bringing you into the garage and firing up the ’68 Camaro. You’ve been turning wrenches ever since." },
  { id:"hipster", title:"The Hipster", description:"People, like, just don’t know. They must explore their inner minds to understand the outside world. If they just took a minute to counter the culture and look inward, they’d understand." },
  { id:"band-geek", title:"The Band Geek", description:"At just the right time you stand up and play your instrument loud and proud. Without you, the football team would have lost Homecoming, the basketball team wouldn’t have gone to State, and the July 4th parade would be lame." },
  { id:"wannabe-lackey", title:"The Wannabe / Lackey", description:"Other kids like you, or they let you hang around. You are always attracted to the most popular kid in the room. If they want a beer, you’ll fetch it for them. If they tell a joke, you’ll laugh the loudest." },
  { id:"tabletop-gamer", title:"The Tabletop Gamer", description:"With your pocket full of polyhedral dice and core rule book hidden safely in your bag, you’re going to have a summer of riding down orc raiders and facing off against demi-lich overlords!" },
  { id:"karate-kid", title:"The Karate Kid", description:"You’ve been training since you could walk at the Viper’s Den dojo. You’ve been in a few tournaments, and you won your last one using the Wren technique." },
  { id:"metal-head", title:"The Metal Head", description:"Slayer RULEZ! Ozzy RULEZ! Breakin’ the law, breakin’ the law!" }
];

const localKey = "campTurnerRoleRosterV2";
const playerKey = "campTurnerPlayerV2";
let currentPlayer = JSON.parse(sessionStorage.getItem(playerKey) || "null");
let selectedRole = null;
let roster = {};
let db = null;
let auth = null;
let currentUser = null;
let useFirebase = false;
let confirmationScarePlayed = false;

const campTheme = document.getElementById("camp-theme");
const musicToggle = document.getElementById("music-toggle");
const deathOverlay = document.getElementById("death-overlay");
const deathSmall = document.getElementById("death-small");
const deathMain = document.getElementById("death-main");

if (campTheme) {
  campTheme.volume = 0.28;
  campTheme.preservesPitch = false;
  campTheme.webkitPreservesPitch = false;
}

const screens = {
  confirm: document.getElementById("screen-confirm"),
  about: document.getElementById("screen-about"),
  volunteer: document.getElementById("screen-volunteer"),
  confirmation: document.getElementById("screen-confirmation")
};

function showScreen(name){
  if ((name === "volunteer" || name === "confirmation") && !currentPlayer) name = "confirm";
  if (name === "confirmation" && !currentPlayer?.roleId) name = "volunteer";
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle("active", key === name));
  window.scrollTo({top:0, behavior:"smooth"});
}

document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("click", () => showScreen(button.dataset.nav)));

musicToggle?.addEventListener("click", async () => {
  if (!campTheme) return;
  if (campTheme.paused) {
    try {
      campTheme.playbackRate = 1;
      await campTheme.play();
      musicToggle.textContent = "■ STOP CAMP RADIO";
      musicToggle.setAttribute("aria-pressed", "true");
    } catch {
      musicToggle.textContent = "AUDIO FILE NOT FOUND";
    }
  } else {
    campTheme.pause();
    musicToggle.textContent = "▶ CAMP RADIO";
    musicToggle.setAttribute("aria-pressed", "false");
  }
});

document.getElementById("confirm-form").addEventListener("submit", async event => {
  event.preventDefault();
  const name = document.getElementById("player-name").value.trim();
  const attendance = document.getElementById("attendance").value;
  const acknowledge = document.getElementById("acknowledge").checked;
  if (!name || !attendance || !acknowledge) return flash("confirm-notice", "PLEASE COMPLETE EVERY FIELD.");
  if (attendance !== "confirmed") return flash("confirm-notice", "ATTENDANCE DECLINED. YOUR RECORD HAS NOT BEEN ADDED.");

  const existingRoleId = currentPlayer?.name === name ? currentPlayer?.roleId : null;
  currentPlayer = { name, confirmedAt:new Date().toISOString() };
  if (existingRoleId) currentPlayer.roleId = existingRoleId;
  selectedRole = null;
  document.getElementById("confirm-role").disabled = true;
  sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
  document.getElementById("identity-name").textContent = name.toUpperCase();

  if (campTheme?.paused) {
    try {
      campTheme.playbackRate = 1;
      await campTheme.play();
      musicToggle.textContent = "■ STOP CAMP RADIO";
      musicToggle.setAttribute("aria-pressed", "true");
    } catch {}
  }
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
      <span class="role-availability">${claim ? "ROLE CLAIMED" : "AVAILABLE"}</span>
      <h3>${role.title}</h3>
      <p>${role.description}</p>
    `;
    card.addEventListener("click", () => {
      if (claim || currentPlayer?.roleId) return;
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
  document.getElementById("dialog-copy").textContent = `${currentPlayer.name}, claim ${role.title} as your Camp Turner counselor role?`;
  document.getElementById("confirm-dialog").showModal();
});

document.getElementById("cancel-dialog").addEventListener("click", () => document.getElementById("confirm-dialog").close());

document.getElementById("approve-dialog").addEventListener("click", async () => {
  document.getElementById("confirm-dialog").close();
  if (!selectedRole || !currentPlayer || currentPlayer.roleId) return;
  const role = roles.find(r => r.id === selectedRole);
  try {
    if (useFirebase) await claimFirebaseRole(role);
    else {
      const latest = JSON.parse(localStorage.getItem(localKey) || "{}");
      if (latest[role.id]) throw new Error("That role was just claimed.");
      latest[role.id] = { name:currentPlayer.name, roleTitle:role.title, claimedAt:new Date().toISOString() };
      localStorage.setItem(localKey, JSON.stringify(latest));
      roster = latest;
    }
    currentPlayer.roleId = role.id;
    sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
    populateConfirmation(role);
    selectedRole = null;
    document.getElementById("confirm-role").disabled = true;
    renderRoles();
    document.getElementById("page").classList.add("glitch");
    setTimeout(() => document.getElementById("page").classList.remove("glitch"), 900);
    showScreen("confirmation");
    playConfirmationScare();
  } catch (error) {
    flash("role-notice", error.message || "THAT ROLE COULD NOT BE CLAIMED.");
    await refreshRoster();
  }
});

function playConfirmationScare(){
  if (confirmationScarePlayed || !deathOverlay) return;
  confirmationScarePlayed = true;
  if (campTheme && !campTheme.paused) {
    rampPlaybackRate(campTheme, 1, 0.52, 1800);
    campTheme.volume = 0.38;
  }
  deathSmall.textContent = "CAMP TURNER WELCOMES YOU";
  deathMain.textContent = "YOUR ROLE IS CONFIRMED";
  deathOverlay.classList.add("active");
  deathOverlay.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    deathOverlay.classList.add("corrupted");
    deathSmall.textContent = "YOU HAVE BEEN EXPECTED";
    deathMain.textContent = "YOU’RE GOING TO DIE";
    speakWarning();
  }, 2200);
  setTimeout(() => {
    deathOverlay.classList.remove("active", "corrupted");
    deathOverlay.setAttribute("aria-hidden", "true");
    document.getElementById("error-fragment").textContent = "RECORD VERIFIED // SURVIVAL STATUS: PENDING";
    if (campTheme && !campTheme.paused) {
      campTheme.volume = 0.28;
      rampPlaybackRate(campTheme, campTheme.playbackRate, 1, 1300);
    }
  }, 4700);
}

function rampPlaybackRate(audio, from, to, duration){
  const start = performance.now();
  audio.playbackRate = from;
  function step(now){
    const progress = Math.min((now - start) / duration, 1);
    audio.playbackRate = from + (to - from) * progress;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function speakWarning(){
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const warning = new SpeechSynthesisUtterance("You are going to die.");
  warning.rate = 0.55;
  warning.pitch = 0.35;
  warning.volume = 0.8;
  window.speechSynthesis.speak(warning);
}

function populateConfirmation(role){
  document.getElementById("complete-name").textContent = currentPlayer.name.toUpperCase();
  document.getElementById("complete-role").textContent = role.title;
  document.getElementById("complete-location").textContent = "ASSIGNED LATER";
}

document.getElementById("copy-confirmation").addEventListener("click", async () => {
  if (!currentPlayer?.roleId) return;
  const role = roles.find(r => r.id === currentPlayer.roleId);
  const text = `CAMP TURNER SUMMER STAFF '85\nPlayer: ${currentPlayer.name}\nCounselor Role: ${role.title}\nCamp Duty: Assigned later\nStatus: Claimed`;
  await navigator.clipboard.writeText(text);
  flash("complete-notice", "CONFIRMATION COPIED TO CLIPBOARD.");
});

document.getElementById("change-assignment").addEventListener("click", async () => {
  if (!currentPlayer?.roleId) return;
  const roleId = currentPlayer.roleId;
  try {
    if (useFirebase) {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      await deleteDoc(doc(db, "campTurnerRoles", roleId));
    } else {
      const latest = JSON.parse(localStorage.getItem(localKey) || "{}");
      delete latest[roleId];
      localStorage.setItem(localKey, JSON.stringify(latest));
      roster = latest;
    }
    delete currentPlayer.roleId;
    sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
    confirmationScarePlayed = false;
    await refreshRoster();
    showScreen("volunteer");
  } catch {
    flash("complete-notice", "YOUR ROLE COULD NOT BE RELEASED.");
  }
});

async function setupDatabase(){
  const configured = useSharedDatabase && firebaseConfig?.apiKey && !firebaseConfig.apiKey.includes("PASTE_");
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
    const { getAuth, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    const credential = await signInAnonymously(auth);
    currentUser = credential.user;
    useFirebase = true;
    document.getElementById("database-mode").textContent = "LIVE SHARED";
    onSnapshot(collection(db, "campTurnerRoles"), snapshot => {
      roster = {};
      snapshot.forEach(docSnap => roster[docSnap.id] = docSnap.data());
      renderRoles();
      restoreClaimedRole();
    }, error => {
      console.error(error);
      document.getElementById("database-mode").textContent = "DATABASE ERROR";
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
  const { doc, runTransaction, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const roleRef = doc(db, "campTurnerRoles", role.id);
  await runTransaction(db, async transaction => {
    const roleDoc = await transaction.get(roleRef);
    if (roleDoc.exists()) throw new Error("That role was just claimed.");
    transaction.set(roleRef, {
      name: currentPlayer.name,
      roleTitle: role.title,
      claimedByUid: currentUser.uid,
      claimedAt: serverTimestamp()
    });
  });
}

function restoreClaimedRole(){
  if (!currentPlayer?.roleId) return;
  const claim = roster[currentPlayer.roleId];
  if (!claim) {
    delete currentPlayer.roleId;
    sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
    return;
  }
  if (useFirebase && claim.claimedByUid !== currentUser?.uid) {
    delete currentPlayer.roleId;
    sessionStorage.setItem(playerKey, JSON.stringify(currentPlayer));
    return;
  }
  const role = roles.find(r => r.id === currentPlayer.roleId);
  if (role) populateConfirmation(role);
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

if (currentPlayer?.name) document.getElementById("identity-name").textContent = currentPlayer.name.toUpperCase();
document.getElementById("counter").textContent = String(1985 + Math.floor(Math.random() * 700)).padStart(6, "0");
setupDatabase();
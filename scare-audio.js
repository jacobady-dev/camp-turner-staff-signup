(() => {
  const overlay = document.getElementById("death-overlay");
  const roar = document.getElementById("corruption-roar");
  const campTheme = document.getElementById("camp-theme");
  const small = document.getElementById("death-small");
  const main = document.getElementById("death-main");
  const role = document.getElementById("complete-role");
  const stamp = document.querySelector(".completion-card .stamp");

  if (!overlay) return;

  let running = false;
  let timers = [];
  let flickerTimer = null;
  let originalRole = "";
  let originalStamp = "";

  function later(delay, callback) {
    const timer = window.setTimeout(callback, delay);
    timers.push(timer);
  }

  function startCorruption() {
    if (running) return;
    running = true;

    originalRole = role?.textContent || "";
    originalStamp = stamp?.innerHTML || "";

    if (campTheme && !campTheme.paused) campTheme.volume = 0.08;

    if (roar) {
      roar.pause();
      roar.currentTime = 0;
      roar.volume = 1;
      roar.playbackRate = 1;
      roar.play().catch(() => {
        console.warn("Corruption roar file is missing or could not be played.");
      });
    }

    if (role) role.textContent = "MISSING COUNSELOR";
    if (stamp) stamp.innerHTML = "DECEASED<br><span>SUMMER ’85</span>";

    overlay.style.filter = "contrast(1.7) saturate(1.8) brightness(.7)";

    flickerTimer = window.setInterval(() => {
      overlay.style.transform = Math.random() > 0.5
        ? `translate(${Math.floor(Math.random() * 7) - 3}px, ${Math.floor(Math.random() * 5) - 2}px)`
        : "translate(0,0)";
      overlay.style.backgroundColor = Math.random() > 0.72 ? "#410000" : "#160000";
    }, 90);

    later(150, () => {
      small.textContent = "PROPERTY OF CAMP TURNER SECURITY";
      main.textContent = "TAPE 13 // UNAUTHORIZED PLAYBACK";
    });

    later(2400, () => {
      small.textContent = "TRANSPORT RECORD CORRUPTED";
      main.textContent = "DO NOT LEAVE THE BUS";
    });

    later(4800, () => {
      small.textContent = "COUNSELOR STATUS: MISSING";
      main.textContent = "HE IS STILL HUNGRY";
    });

    later(7200, () => {
      small.textContent = "CABIN ROSTER RECOVERED";
      main.textContent = "IT KNOWS YOUR NAME";
    });

    later(9400, () => {
      small.textContent = "YOU HAVE BEEN EXPECTED";
      main.textContent = "YOU’RE GOING TO DIE";
    });
  }

  function stopCorruption() {
    if (!running) return;
    running = false;

    timers.forEach(window.clearTimeout);
    timers = [];

    if (flickerTimer) window.clearInterval(flickerTimer);
    flickerTimer = null;

    overlay.style.transform = "";
    overlay.style.filter = "";
    overlay.style.backgroundColor = "";

    if (roar) {
      roar.pause();
      roar.currentTime = 0;
    }

    if (role && originalRole) role.textContent = originalRole;
    if (stamp && originalStamp) stamp.innerHTML = originalStamp;
  }

  const observer = new MutationObserver(() => {
    if (overlay.classList.contains("corrupted")) startCorruption();
    else stopCorruption();
  });

  observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });
})();
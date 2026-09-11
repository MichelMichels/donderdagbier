/**
 * Donderdagbier.be - Application Logic, Database, Roulette & Easter Eggs
 * Versie: v1.6.1
 */

// De complete, actieve lijst van cafés (enkel 8790 Waregem, Sportcafé Desselgem is verwijderd en De Regenboog is toegevoegd)
const cafesList = [
  {
    name: "Hermanos",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "'t Leeuwke",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "'t Gaverke",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Ter Leie",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Bowling",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Sportcafé Waregem",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  // Sportcafé Desselgem is verwijderd conform beslissing "geen cafés buiten Waregem"
  {
    name: "De Treffer",
    rated: true,
    score: "53.57%",
    location: "Waregem",
    visitDate: "03/09/2026",
    seating: "Terras",
    pricePils: "€2.80",
    pricePicon: "€9.00",
    note: null,
  },
  {
    name: "De Regenboog",
    rated: true,
    score: "55.73%",
    location: "Waregem",
    visitDate: "10/09/2026",
    seating: "Terras",
    pricePils: "€2.50",
    pricePicon: null, // Geen picon beschikbaar
    note: "Geen picon, 1 rondje van de bazin",
  },
  {
    name: "Bridge",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Markt 28",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Jootn's Corner",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Klauwaert",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Zabarov",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "De Knok",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Jackie O",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Tennis WGTC",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Fools",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Casa El Vid",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Bar Caballo",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Peirdeke",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Cultuurcafé",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Tuin MM (zomer)",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Arrivée",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Mrs Sippy",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Den Hemel",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Park Casier",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Jeugdhuis",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Karekiet",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "'t Labierint",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Cottage",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "De Toekomst",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "'t Gaverhopke",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "'t Brouwerijtje",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Stroatje zonder ende",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Geestige Put",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
  {
    name: "Mes Amis",
    rated: false,
    score: null,
    location: "Waregem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
    note: null,
  },
];

let currentFilter = "all";
let searchQuery = "";

/**
 * Genereert de cafékaarten op de homepage
 */
function renderCafes() {
  const grid = document.getElementById("cafes-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = cafesList.filter((cafe) => {
    const matchesSearch = cafe.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (currentFilter === "rated") {
      return matchesSearch && cafe.rated;
    } else if (currentFilter === "unrated") {
      return matchesSearch && !cafe.rated;
    }
    return matchesSearch;
  });

  filtered.forEach((cafe) => {
    const card = document.createElement("div");

    if (cafe.rated) {
      const targetPage =
        cafe.name.toLowerCase() === "de treffer"
          ? "detail-de-treffer"
          : "detail-de-regenboog";

      card.className =
        "bg-slate-900/60 border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between hover:border-amber-500/60 transition-all cursor-pointer group";
      card.onclick = () => showPage(targetPage);
      card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Beoordeeld</span>
                        <div class="flex items-center gap-1 text-amber-400 text-xs font-bold">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i>
                            <span>${cafe.score}</span>
                        </div>
                    </div>
                    <h4 class="text-base font-bold text-white group-hover:text-amber-400 transition-colors">${cafe.name}</h4>
                    <p class="text-slate-500 text-xs flex items-center gap-1 mt-1">
                        <i data-lucide="map-pin" class="w-3 h-3"></i> ${cafe.location}
                    </p>
                    <div class="flex items-center gap-2 mt-3 text-[11px] text-slate-400 bg-slate-950/40 px-2 py-1.5 rounded-lg border border-slate-800/40">
                        <span class="font-semibold text-emerald-500">Pils: ${cafe.pricePils}</span>
                        <span class="text-slate-700">|</span>
                        <span class="font-semibold ${cafe.pricePicon ? "text-purple-400" : "text-slate-500"}">Picon: ${cafe.pricePicon || "Geen"}</span>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span class="flex items-center gap-1 text-[11px]"><i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-500"></i> Bezocht: ${cafe.visitDate}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform"></i>
                </div>
            `;
    } else {
      const isDenHemel = cafe.name === "Den Hemel";

      card.className = isDenHemel
        ? "bg-slate-900/45 border border-amber-500/40 rounded-xl p-5 flex flex-col justify-between hover:border-amber-400 cursor-pointer transition-all heavenly-glow group"
        : "bg-slate-900/30 border border-slate-800/60 rounded-xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all";

      if (isDenHemel) {
        card.onclick = () => triggerHeavenlyModal();
        card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-2">
                            <span class="px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide animate-pulse">✨ Stamcafé</span>
                        </div>
                        <h4 class="text-base font-bold text-amber-400 group-hover:text-amber-300 transition-colors">${cafe.name}</h4>
                        <p class="text-slate-500 text-xs flex items-center gap-1 mt-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> ${cafe.location}
                        </p>
                    </div>
                    <div class="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-400 font-bold">
                        <span>Heiligdom betreden...</span>
                        <i data-lucide="sparkles" class="w-4 h-4 animate-spin"></i>
                    </div>
                `;
      } else {
        card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-2">
                            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">Nog te bezoeken</span>
                        </div>
                        <h4 class="text-base font-bold text-slate-300">${cafe.name}</h4>
                        <p class="text-slate-500 text-xs flex items-center gap-1 mt-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> ${cafe.location}
                        </p>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-600">
                        <span>Geen score beschikbaar</span>
                    </div>
                `;
      }
    }
    grid.appendChild(card);
  });

  lucide.createIcons();
}

/**
 * Filtert de cafélijst op basis van de geselecteerde knop
 */
function filterCafes(filterType) {
  currentFilter = filterType;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.className =
      "filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-900 text-slate-400 hover:bg-slate-800";
  });

  const activeBtn = document.getElementById(`btn-filter-${filterType}`);
  if (activeBtn) {
    const counts = {
      all: cafesList.length,
      rated: cafesList.filter((c) => c.rated).length,
      unrated: cafesList.filter((c) => !c.rated).length,
    };
    const labels = {
      all: `Alle cafés (${counts.all})`,
      rated: `Beoordeeld (${counts.rated})`,
      unrated: `Nog te bezoeken (${counts.unrated})`,
    };
    activeBtn.innerText = labels[filterType];
    activeBtn.className =
      "filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-amber-500 text-dark-900";
  }

  renderCafes();
}

/**
 * Beheert de paginatransities (SPA router)
 */
function showPage(pageId) {
  document.querySelectorAll(".page-view").forEach((view) => {
    view.classList.add("hidden");
  });
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.remove("hidden");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ================= STAMINEE ROULETTE LOGICA =================

let isSpinning = false;
function spinRoulette() {
  if (isSpinning) return;

  const unratedCafes = cafesList.filter((c) => !c.rated);
  const resultSpan = document.getElementById("roulette-result");
  const btn = document.getElementById("roulette-btn");

  if (unratedCafes.length === 0) {
    resultSpan.innerText = "Alle cafés zijn bezocht! 🏆";
    return;
  }

  isSpinning = true;
  resultSpan.classList.add("roulette-spinning", "text-amber-400");
  resultSpan.classList.remove("text-slate-500", "italic");
  btn.disabled = true;
  btn.classList.add("opacity-50", "cursor-not-allowed");

  let counter = 0;
  const duration = 2000;
  const intervalTime = 80;

  const interval = setInterval(() => {
    const tempCafe =
      unratedCafes[Math.floor(Math.random() * unratedCafes.length)];
    resultSpan.innerText = `🎰 ${tempCafe.name}...`;
    counter += intervalTime;

    if (counter >= duration) {
      clearInterval(interval);

      const finalCafe =
        unratedCafes[Math.floor(Math.random() * unratedCafes.length)];
      resultSpan.classList.remove("roulette-spinning");
      resultSpan.innerHTML = `🎯 Gekozen: <strong class="text-white text-base">${finalCafe.name}</strong>`;

      isSpinning = false;
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }, intervalTime);
}

// ================= EASTER EGGS LOGIC =================

/**
 * Easter Egg 1: Heavenly Modal voor Den Hemel
 */
function triggerHeavenlyModal() {
  if (document.getElementById("heaven-modal")) return;

  const modal = document.createElement("div");
  modal.id = "heaven-modal";
  modal.className =
    "fixed inset-0 bg-dark-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] opacity-0 transition-opacity duration-300";

  modal.innerHTML = `
        <div class="bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center relative overflow-hidden shadow-2xl">
            <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
            
            <div class="relative z-10">
                <div class="inline-flex p-4 bg-amber-500/20 text-amber-400 rounded-full mb-4 border border-amber-500/30 animate-bounce">
                    <i data-lucide="sparkles" class="w-8 h-8"></i>
                </div>
                
                <h2 class="text-3xl font-black text-white mb-2 tracking-tight">Ode aan Den Hemel! ✨</h2>
                <p class="text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">Het Ultieme Heiligdom</p>
                
                <div class="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 text-left space-y-4 mb-6 text-sm">
                    <p class="text-slate-300 leading-relaxed">
                        Wacht eens even! Je probeert ons absolute <strong class="text-amber-400">stamcafé Den Hemel</strong> te keuren? Hier gelden de wetten van de aardse fysica en nuchterheid niet!
                    </p>
                    <p class="text-slate-300 leading-relaxed">
                        Dit is de plek waar legendarische donderdagen ontstaan en spontaan vervagen in de vroege uurtjes. Onze onofficiële, eeuwige score voor deze spirituele thuisbasis:
                    </p>
                    <div class="text-center py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <span class="block text-[10px] text-slate-500 uppercase font-bold">Eeuwige Score</span>
                        <span class="text-4xl font-black text-amber-400">110%</span>
                        <span class="block text-[10px] text-slate-400 mt-1">"Buiten categorie, schol!"</span>
                    </div>
                </div>
                
                <button id="close-heaven-btn" class="w-full bg-amber-500 hover:bg-amber-600 text-dark-900 font-extrabold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/10">
                    Keer terug naar de aarde
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  lucide.createIcons();

  setTimeout(() => {
    modal.classList.remove("opacity-0");
  }, 50);

  document.getElementById("close-heaven-btn").onclick = () => {
    modal.classList.add("opacity-0");
    setTimeout(() => {
      modal.remove();
    }, 300);
  };
}

/**
 * Easter Egg 2: Zatlap Modus (Drunk Mode)
 */
let isDrunk = false;
function toggleDrunkMode() {
  isDrunk = !isDrunk;
  const body = document.body;
  const subtitle = document.getElementById("header-subtitle");
  const heroTitle = document.getElementById("main-hero-title");
  const heroDesc = document.getElementById("main-hero-desc");
  const searchInput = document.getElementById("search-input");
  const radarText = document.getElementById("radar-text");
  const seasonBadge = document.getElementById("season-badge");
  const leaderboardTitle = document.getElementById("leaderboard-title");

  if (isDrunk) {
    body.classList.add("drunk");

    if (subtitle) subtitle.innerText = "Warregemsshe jcaféwijzzzer... *hic*";
    if (heroTitle) heroTitle.innerHTML = "Donderrrdag issh pin’tjesdag! 🍻";
    if (heroDesc)
      heroDesc.innerText =
        "W-welk café is nu eige-lijk 't aller-allerbeste? S-schol! We keuren ze alllemaal... of toch degene die we nog vinden!";
    if (searchInput) searchInput.placeholder = "Zheuk een caafé... *hup*";
    if (radarText) radarText.innerText = "35 caafés... of wa-ren 't er 40?";
    if (seasonBadge)
      seasonBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Zatlap Modus Actief!`;
    if (leaderboardTitle)
      leaderboardTitle.innerHTML = `<i data-lucide="beer" class="w-4 h-4 text-amber-500 animate-bounce"></i> De s-snelste stijger!`;

    console.log("Zatlap modus geactiveerd! Schol!");
  } else {
    body.classList.remove("drunk");

    if (subtitle) subtitle.innerText = "Waregemse Caféwijzer";
    if (heroTitle) heroTitle.innerHTML = "De Waregemse Donderdagtraditie";
    if (heroDesc)
      heroDesc.innerText =
        "Elke donderdag trekken we op pad om de lokale staminees in Waregem te keuren. Enkel echte Waregemse cafés (postcode 8790) komen in aanmerking!";
    if (searchInput) searchInput.placeholder = "Zoek café...";
    if (radarText) radarText.innerText = "35 Waregemse cafés op de radar";
    if (seasonBadge)
      seasonBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Huidig seizoen 2026`;
    if (leaderboardTitle)
      leaderboardTitle.innerHTML = `<i data-lucide="crown" class="w-4 h-4 text-amber-500"></i> Huidige koplopers`;

    console.log("Ontnuchterd! Welkom terug.");
  }
  lucide.createIcons();
}

/**
 * Easter Egg 3: "BIER" Cheatcode (Bierdouche)
 */
let keyBuffer = "";
function checkCheatCode(e) {
  keyBuffer += e.key.toLowerCase();
  if (keyBuffer.length > 10) {
    keyBuffer = keyBuffer.substring(keyBuffer.length - 4);
  }

  if (keyBuffer.endsWith("bier")) {
    triggerBeerShower();
    keyBuffer = "";
  }
}

function triggerBeerShower() {
  const beerEmojis = ["🍺", "🍻", "🥂"];
  const container = document.body;

  const interval = setInterval(() => {
    const drop = document.createElement("div");
    drop.className = "beer-drop";
    drop.innerText = beerEmojis[Math.floor(Math.random() * beerEmojis.length)];
    drop.style.left = Math.random() * 100 + "vw";
    drop.style.animationDuration = Math.random() * 2 + 2 + "s";
    drop.style.opacity = Math.random() * 0.5 + 0.5;

    container.appendChild(drop);

    setTimeout(() => {
      drop.remove();
    }, 4000);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
  }, 5000);
}

// Event Listeners & Initialisatie
document.addEventListener("DOMContentLoaded", () => {
  renderCafes();
  lucide.createIcons();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderCafes();
    });
  }

  const logoBtn = document.getElementById("header-logo");
  if (logoBtn) {
    logoBtn.addEventListener("dblclick", toggleDrunkMode);
  }

  window.addEventListener("keydown", checkCheatCode);
});

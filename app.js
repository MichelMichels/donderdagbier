/**
 * Donderdagbier.be - Application Logic & Database
 * Versie: v1.4.0
 */

// De complete, effectieve lijst van 36 cafés uit Waregem en deelgemeenten
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
  },
  {
    name: "Sportcafé Desselgem",
    rated: false,
    score: null,
    location: "Desselgem",
    visitDate: null,
    seating: null,
    pricePils: null,
    pricePicon: null,
  },
  {
    name: "De Treffer",
    rated: true,
    score: "53.57%",
    location: "Waregem",
    visitDate: "03/09/2026",
    seating: "Terras",
    pricePils: "€2.80",
    pricePicon: "€9.00",
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
  },
];

let currentFilter = "all";
let searchQuery = "";

/**
 * Genereert de cafékaarten dynamisch op basis van de filters en zoekopdrachten
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
      card.className =
        "bg-slate-900/60 border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between hover:border-amber-500/60 transition-all cursor-pointer group";
      card.onclick = () => showPage("detail-de-treffer");
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
                        <span class="font-semibold text-purple-400">Picon: ${cafe.pricePicon}</span>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span class="flex items-center gap-1 text-[11px]"><i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-500"></i> Bezocht: ${cafe.visitDate}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform"></i>
                </div>
            `;
    } else {
      card.className =
        "bg-slate-900/30 border border-slate-800/60 rounded-xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all";
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
    grid.appendChild(card);
  });

  // Herlaad de Lucide icoontjes voor de nieuw gegenereerde elementen
  lucide.createIcons();
}

/**
 * Filtert de cafélijst op basis van de geselecteerde knop
 */
function filterCafes(filterType) {
  currentFilter = filterType;

  // Reset alle knopstijlen naar inactief
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.className =
      "filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-900 text-slate-400 hover:bg-slate-800";
  });

  // Zet de actieve knopstijl naar goud/amber
  const activeBtn = document.getElementById(`btn-filter-${filterType}`);
  if (activeBtn) {
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

// Event Listeners & Initialisatie
document.addEventListener("DOMContentLoaded", () => {
  // Rendert de cafés bij het laden van de pagina
  renderCafes();

  // Initialiseert de Lucide icoontjes op statische elementen
  lucide.createIcons();

  // Koppel de zoekbalk logica
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderCafes();
    });
  }
});

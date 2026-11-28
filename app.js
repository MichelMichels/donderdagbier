/**
 * Donderdagbier.be - Application Logic, Database, Roulette & Easter Eggs
 * Versie: v1.15.0
 */

// De complete, actieve lijst van cafés (Groot-Waregem: Waregem en de deelgemeentes Beveren-Leie, Desselgem, Nieuwenhove en Sint-Eloois-Vijve)
// Wordt asynchroon ingeladen vanuit cafes.json, zie loadCafesList()
let cafesList = [];

/**
 * Laadt de cafélijst in vanuit het externe cafes.json bestand
 */
async function loadCafesList() {
  const response = await fetch("cafes.json");
  if (!response.ok) {
    throw new Error(`Kon cafes.json niet inladen (status ${response.status})`);
  }
  cafesList = await response.json();
}

// ================= SCOREBEREKENING =================
// Categorieën van de jurybeoordeling, telkens op een schaal van 0 tot CATEGORY_MAX.
// Enkel de ruwe scores per jurylid staan in cafes.json; alle gemiddelden,
// totalen en percentages worden hieruit berekend zodat ze nooit uit sync kunnen raken.
const JUDGE_CATEGORIES = [
  "Pils",
  "Picon",
  "Bediening",
  "Gezelligheid",
  "Muziek",
  "Aanbod",
];
const CATEGORY_MAX = 12;

/**
 * Bepaalt de pagina-slug (zonder "detail-" prefix) van een beoordeeld café,
 * afgeleid van de café-naam (lowercase, accenten verwijderd, spaties/overige
 * tekens vervangen door een koppelteken).
 */
function getCafeSlug(cafe) {
  return cafe.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Berekent de categoriegemiddelden, eindscore en per-jurylid totalen/percentages
 * op basis van de ruwe jurygegevens van een café. Geeft null terug als er geen
 * jurygegevens beschikbaar zijn.
 */
function computeScoreStats(cafe) {
  if (!cafe.judges || cafe.judges.length === 0) return null;

  const totalMax = JUDGE_CATEGORIES.length * CATEGORY_MAX;

  const judges = cafe.judges.map((judge) => {
    const total = judge.scores.reduce((sum, score) => sum + score, 0);
    const percent = (total / totalMax) * 100;
    return { ...judge, total, percent };
  });

  const categoryAverages = JUDGE_CATEGORIES.map((_, index) => {
    const sum = cafe.judges.reduce(
      (acc, judge) => acc + judge.scores[index],
      0,
    );
    return sum / cafe.judges.length;
  });

  const totalPoints =
    judges.reduce((sum, judge) => sum + judge.total, 0) / judges.length;
  const percent = (totalPoints / totalMax) * 100;

  return { categoryAverages, totalMax, totalPoints, percent, judges };
}

let currentFilter = "all";
let searchQuery = "";

/**
 * Toont (indien aanwezig) de aankondiging van het volgende te bezoeken café.
 * Er wordt in cafes.json op zijn hoogst één café met "nextVisit": true
 * verwacht; is er geen enkel café aangeduid, dan blijft de banner verborgen.
 */
function renderNextVisitBanner() {
  const wrapper = document.getElementById("next-visit-banner");
  if (!wrapper) return;

  const nextCafe = cafesList.find((cafe) => cafe.nextVisit);

  if (!nextCafe) {
    wrapper.classList.add("hidden");
    wrapper.innerHTML = "";
    return;
  }

  wrapper.classList.remove("hidden");
  wrapper.innerHTML = `
    <div class="bg-gradient-to-br from-amber-500/15 via-slate-900/40 to-transparent border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-amber-500/20">
          <i data-lucide="calendar-clock" class="w-3.5 h-3.5"></i>
          <span>Volgende halte</span>
        </div>
        <h3 class="text-xl font-extrabold text-white">${nextCafe.name}</h3>
        <p class="text-slate-400 text-xs mt-1 flex items-center gap-1">
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-500"></i>
          ${nextCafe.location}
        </p>
      </div>
      <div
        class="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-extrabold"
      >
        <i data-lucide="sparkles" class="w-4 h-4"></i>
        <span>Binnenkort!</span>
      </div>
    </div>
  `;

  lucide.createIcons();
}

/**
 * Geeft de cafés terug die voldoen aan de actieve filter en zoekterm.
 * Wordt gedeeld door de lijst- en de kaartweergave.
 */
function getFilteredCafes() {
  const query = searchQuery.toLowerCase();
  return cafesList.filter((cafe) => {
    const matchesSearch = cafe.name.toLowerCase().includes(query);
    if (currentFilter === "rated") {
      return matchesSearch && cafe.rated;
    } else if (currentFilter === "unrated") {
      return matchesSearch && !cafe.rated;
    }
    return matchesSearch;
  });
}

// ================= KAARTWEERGAVE =================
// De coördinaten (lat/lng) staan in cafes.json. Cafés zonder coördinaten
// verschijnen enkel in de lijst; onder de kaart staat hoeveel er ontbreken.

let currentView = "list";
let cafeMap = null;
let cafeMarkerLayer = null;
const MAP_DEFAULT_CENTER = [50.8865, 3.4155]; // Groot-Waregem
const MAP_DEFAULT_ZOOM = 13;

function hasCoordinates(cafe) {
  return Number.isFinite(cafe.lat) && Number.isFinite(cafe.lng);
}

/**
 * Schakelt tussen de lijst- en de kaartweergave van het caféoverzicht
 */
function setCafeView(view) {
  currentView = view;
  const grid = document.getElementById("cafes-grid");
  const mapWrapper = document.getElementById("cafes-map-wrapper");
  if (!grid || !mapWrapper) return;

  grid.classList.toggle("hidden", view !== "list");
  mapWrapper.classList.toggle("hidden", view !== "map");

  document.querySelectorAll(".view-btn").forEach((btn) => {
    const active = btn.id === `btn-view-${view}`;
    btn.setAttribute("aria-pressed", String(active));
    btn.classList.toggle("bg-amber-500", active);
    btn.classList.toggle("text-dark-900", active);
    btn.classList.toggle("text-slate-400", !active);
    btn.classList.toggle("hover:text-slate-200", !active);
  });

  if (view === "map") {
    renderCafeMap();
  }
}

function initCafeMap() {
  if (cafeMap || typeof L === "undefined") return;
  const container = document.getElementById("cafes-map");
  if (!container) return;

  cafeMap = L.map(container, {
    center: MAP_DEFAULT_CENTER,
    zoom: MAP_DEFAULT_ZOOM,
    scrollWheelZoom: false,
  });

  // Standaard OpenStreetMap-tegels; de donkere look komt uit een CSS-filter in styles.css
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers',
  }).addTo(cafeMap);

  cafeMarkerLayer = L.layerGroup().addTo(cafeMap);

  // Scrollen zoomt pas na een klik op de kaart, zodat de pagina vlot blijft scrollen
  cafeMap.on("click", () => cafeMap.scrollWheelZoom.enable());
  cafeMap.on("mouseout", () => cafeMap.scrollWheelZoom.disable());
}

function cafeMarkerStyle(cafe) {
  if (cafe.nextVisit) {
    return { radius: 10, color: "#6ee7b7", weight: 3, fillColor: "#34d399", fillOpacity: 0.95 };
  }
  if (cafe.rated) {
    return { radius: 8, color: "#fde68a", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.95 };
  }
  return { radius: 6, color: "#cbd5e1", weight: 1.5, fillColor: "#64748b", fillOpacity: 0.85 };
}

function cafePopupHtml(cafe) {
  const name = escapeHtml(cafe.displayName || cafe.name);
  const address = cafe.address ? `<div class="map-popup-meta">${escapeHtml(cafe.address)}</div>` : "";

  if (cafe.rated) {
    const stats = computeScoreStats(cafe);
    const scoreText = stats ? `${stats.percent.toFixed(2)}%` : cafe.score || "–";
    const slug = getCafeSlug(cafe);
    return `
      <div class="map-popup-title">${name}</div>
      ${address}
      <div class="map-popup-score">★ ${escapeHtml(scoreText)}</div>
      <div class="map-popup-meta">Bezocht op ${escapeHtml(cafe.visitDate || "–")}</div>
      <button type="button" class="map-popup-link" onclick="showPage('detail-${slug}')">Bekijk rapport →</button>
    `;
  }

  const status = cafe.nextVisit ? "Volgende halte" : "Nog te bezoeken";
  return `
    <div class="map-popup-title">${name}</div>
    ${address}
    <div class="map-popup-meta">${status}</div>
  `;
}

/**
 * Tekent de markers voor de gefilterde cafés op de kaart
 */
function renderCafeMap() {
  if (currentView !== "map") return;
  initCafeMap();
  if (!cafeMap) return;

  // De kaart kan in een verborgen container aangemaakt zijn: afmetingen opnieuw meten
  cafeMap.invalidateSize();
  cafeMarkerLayer.clearLayers();

  const filtered = getFilteredCafes();
  const located = filtered.filter(hasCoordinates);
  // Volgende halte bovenaan tekenen, beoordeelde cafés boven de nog te bezoeken
  const order = (cafe) => (cafe.nextVisit ? 2 : cafe.rated ? 1 : 0);
  located
    .slice()
    .sort((a, b) => order(a) - order(b))
    .forEach((cafe) => {
      L.circleMarker([cafe.lat, cafe.lng], cafeMarkerStyle(cafe))
        .bindTooltip(escapeHtml(cafe.name), { direction: "top", offset: [0, -6] })
        .bindPopup(cafePopupHtml(cafe), { className: "map-popup" })
        .addTo(cafeMarkerLayer);
    });

  if (located.length > 0) {
    cafeMap.fitBounds(
      L.latLngBounds(located.map((cafe) => [cafe.lat, cafe.lng])),
      { padding: [40, 40], maxZoom: 16 },
    );
  }

  const missing = filtered.length - located.length;
  const missingLabel = document.getElementById("cafes-map-missing");
  if (missingLabel) {
    missingLabel.textContent =
      missing === 0
        ? ""
        : `${missing} ${missing === 1 ? "café staat" : "cafés staan"} (nog) niet op de kaart`;
  }
}

/**
 * Genereert de cafékaarten op de homepage
 */
function renderCafes() {
  const grid = document.getElementById("cafes-grid");
  if (!grid) return;

  grid.innerHTML = "";

  getFilteredCafes().forEach((cafe) => {
    const card = document.createElement("div");

    if (cafe.rated) {
      const targetPage = `detail-${getCafeSlug(cafe)}`;
      const stats = computeScoreStats(cafe);
      const scoreText = stats ? `${stats.percent.toFixed(2)}%` : cafe.score;

      card.className =
        "bg-slate-900/60 border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between hover:border-amber-500/60 transition-all cursor-pointer group";
      card.onclick = () => showPage(targetPage);
      card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Beoordeeld</span>
                        <div class="flex items-center gap-1 text-amber-400 text-xs font-bold">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i>
                            <span>${scoreText}</span>
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
  renderCafeMap();
}

/**
 * Genereert het "Huidige koplopers" leaderboard op basis van de top 3
 * beoordeelde cafés, gesorteerd op eindscore
 */
function renderLeaderboard() {
  const container = document.getElementById("leaderboard-list");
  if (!container) return;

  const ranked = cafesList
    .filter((cafe) => cafe.rated)
    .map((cafe) => ({ cafe, stats: computeScoreStats(cafe) }))
    .filter((entry) => entry.stats)
    .sort((a, b) => b.stats.percent - a.stats.percent)
    .slice(0, 3);

  const medals = ["🥇", "🥈", "🥉"];

  container.innerHTML = ranked
    .map(({ cafe, stats }, index) => {
      const isFirst = index === 0;
      const targetPage = `detail-${getCafeSlug(cafe)}`;
      const displayName = cafe.displayName || cafe.name;
      const shortAddress = (cafe.address || cafe.location).replace(
        /\b\d{4}\s/,
        "",
      );
      const rankLabel = isFirst
        ? `${medals[0]} Nr 1 Koploper`
        : `${medals[index] || ""} Nr ${index + 1}`;

      return `
        <div
          onclick="showPage('${targetPage}')"
          class="${
            isFirst
              ? "bg-gradient-to-br from-amber-500/15 via-slate-900/40 to-transparent border border-amber-500/40 rounded-2xl p-5 cursor-pointer hover:border-amber-500/80 transition-all group relative overflow-hidden"
              : "bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 cursor-pointer hover:border-amber-500/40 transition-all group"
          }"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                  isFirst
                    ? "bg-amber-500 text-dark-900"
                    : "bg-slate-800 text-slate-400"
                } text-[10px] font-extrabold uppercase">${rankLabel}</span>
                <span class="text-[10px] ${
                  isFirst
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-800/60 text-slate-400"
                } px-2 py-0.5 rounded font-medium">Bezocht op ${cafe.visitDate}</span>
              </div>
              <h3 class="text-xl ${
                isFirst
                  ? "font-extrabold text-white"
                  : "font-bold text-slate-200"
              } group-hover:text-amber-400 transition-colors">${displayName}</h3>
              <p class="text-slate-400 text-xs mt-1 flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-500"></i>
                ${shortAddress}
              </p>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-auto">
              <div class="text-right">
                <span class="block text-[10px] text-slate-500 uppercase font-bold">Score</span>
                <span class="text-2xl font-black ${
                  isFirst ? "text-amber-400" : "text-slate-400"
                }">${stats.percent.toFixed(2)}%</span>
              </div>
              <div class="p-2 ${
                isFirst
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-slate-800 text-slate-400"
              } rounded-lg group-hover:translate-x-1 transition-transform">
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  lucide.createIcons();
}

function escapeHtml(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

function parseCafePrice(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^\s*€\s*(\d+(?:[.,]\d{1,2})?)\s*$/);
  if (!match) return null;

  const price = Number(match[1].replace(",", "."));
  return Number.isFinite(price) ? price : null;
}

function formatEuro(price) {
  return `€${price.toFixed(2).replace(".", ",")}`;
}

/**
 * Rendert een gestapelde dotplot: één stip per café op de prijs-as; cafés met
 * dezelfde prijs worden boven elkaar gestapeld.
 */
function renderPriceDotPlot(container, chartId, title, observations, color) {
  if (!container) return;
  if (!observations.length) {
    container.innerHTML =
      '<p class="text-xs text-slate-500">Er zijn nog geen prijsgegevens beschikbaar.</p>';
    return;
  }

  const sorted = observations.map((entry) => entry.price).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  const mean = sorted.reduce((sum, price) => sum + price, 0) / sorted.length;
  const minPrice = sorted[0];
  const maxPrice = sorted[sorted.length - 1];

  const step = maxPrice - minPrice <= 3 ? 0.5 : 1;
  let axisMin = Math.floor(minPrice / step) * step;
  let axisMax = Math.ceil(maxPrice / step) * step;
  if (axisMin === minPrice) axisMin = Math.max(0, axisMin - step);
  if (axisMax === maxPrice) axisMax += step;

  const groups = new Map();
  observations
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((entry) => {
      const key = Math.round(entry.price * 100);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });
  const maxStack = Math.max(...Array.from(groups.values(), (g) => g.length));

  const dotRadius = 8;
  const dotSpacing = dotRadius * 2 + 4;
  const chartWidth = 640;
  const padding = { top: 16, right: 24, bottom: 34, left: 24 };
  const plotHeight = Math.max(80, maxStack * dotSpacing + 8);
  const chartHeight = padding.top + plotHeight + padding.bottom;
  const plotWidth = chartWidth - padding.left - padding.right;
  const baseline = padding.top + plotHeight;
  const x = (price) =>
    padding.left + ((price - axisMin) / (axisMax - axisMin)) * plotWidth;

  const ticks = [];
  for (let tick = axisMin; tick <= axisMax + 1e-9; tick += step) {
    ticks.push(tick);
  }
  const axis = ticks
    .map(
      (tick) => `
        <line x1="${x(tick)}" y1="${padding.top}" x2="${x(tick)}" y2="${baseline}" stroke="#1e293b" />
        <text x="${x(tick)}" y="${baseline + 22}" text-anchor="middle" fill="#64748b" font-size="13">${formatEuro(tick)}</text>
      `,
    )
    .join("");

  const dots = Array.from(groups.values())
    .map((group) =>
      group
        .map((entry, index) => {
          const cy = baseline - dotRadius - 4 - index * dotSpacing;
          return `
            <circle cx="${x(entry.price)}" cy="${cy}" r="${dotRadius}" fill="${color}" fill-opacity="0.9" stroke="#0f172a" stroke-width="2">
              <title>${escapeHtml(entry.name)}: ${formatEuro(entry.price)}</title>
            </circle>
          `;
        })
        .join(""),
    )
    .join("");

  const referenceLine = (value, dashed) => `
    <line x1="${x(value)}" y1="${padding.top - 8}" x2="${x(value)}" y2="${baseline}" stroke="#e2e8f0" stroke-width="1.5" ${dashed ? 'stroke-dasharray="5 4"' : ""} />
  `;

  const description = observations
    .slice()
    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
    .map((entry) => `${escapeHtml(entry.name)}: ${formatEuro(entry.price)}`)
    .join(", ");

  container.innerHTML = `
    <svg
      class="w-full h-auto"
      viewBox="0 0 ${chartWidth} ${chartHeight}"
      role="img"
      aria-labelledby="${chartId}-title ${chartId}-desc"
    >
      <title id="${chartId}-title">Verdeling ${escapeHtml(title.toLowerCase())}</title>
      <desc id="${chartId}-desc">${description}</desc>
      <g aria-hidden="true">
        ${axis}
        <line x1="${padding.left}" y1="${baseline}" x2="${chartWidth - padding.right}" y2="${baseline}" stroke="#334155" />
        ${referenceLine(median, false)}
        ${referenceLine(mean, true)}
        ${dots}
      </g>
    </svg>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-400">
      <span class="inline-flex items-center gap-1.5"><span class="inline-block w-4 border-t-2 border-slate-200"></span>Mediaan ${formatEuro(median)}</span>
      <span class="inline-flex items-center gap-1.5"><span class="inline-block w-4 border-t-2 border-dashed border-slate-200"></span>Gemiddelde ${formatEuro(mean)}</span>
      <span>Bereik ${formatEuro(minPrice)} – ${formatEuro(maxPrice)}</span>
    </div>
  `;
}

/**
 * Genereert kerncijfers en scoregrafieken op basis van de cafébeoordelingen
 */
const EMPTY_SCORE_MESSAGE =
  '<p class="text-xs text-slate-500">Er zijn nog geen jurybeoordelingen beschikbaar.</p>';

function parseCafeVisitDate(value) {
  const match = String(value || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 ? date : null;
}

function getValidJudges(cafe) {
  return (cafe.judges || []).filter((judge) => {
    const initials = String(judge.initials || "").trim();
    return initials && initials !== "--" && Array.isArray(judge.scores);
  });
}

function heatColor(value, max) {
  const ratio = Math.max(0, Math.min(1, value / max));
  return `hsl(${Math.round(ratio * 130)} 65% 30%)`;
}

function standardDeviation(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length,
  );
}

// Asbereik afgerond op `step`, met minstens één stap marge rond de data
function paddedRange(values, step, floor = -Infinity, ceiling = Infinity) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  let low = Math.floor(min / step) * step;
  let high = Math.ceil(max / step) * step;
  if (low === min) low -= step;
  if (high === max) high += step;
  return [Math.max(floor, low), Math.min(ceiling, high)];
}

function heatLegend() {
  return `
    <div class="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
      <span>0</span>
      <span class="h-2 w-32 rounded-full" style="background: linear-gradient(to right, ${heatColor(0, 1)}, ${heatColor(0.5, 1)}, ${heatColor(1, 1)})"></span>
      <span>${CATEGORY_MAX}</span>
    </div>
  `;
}

function renderHeatTable(container, firstHeader, extraHeader, lastHeader, rows, footer) {
  const cell = (value, title) => `
    <td class="p-0.5">
      <div class="rounded-md px-2 py-1.5 text-center font-bold text-white" style="background: ${heatColor(value, CATEGORY_MAX)}" title="${escapeHtml(title)}">${value.toFixed(1)}</div>
    </td>
  `;
  const renderRow = (row, isFooter = false) => `
    <tr class="${isFooter ? "border-t border-slate-700" : ""}">
      <th scope="row" class="p-1.5 pr-3 text-left font-semibold ${isFooter ? "text-slate-400" : "text-slate-200"} whitespace-nowrap max-w-[12rem] truncate" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</th>
      ${extraHeader ? `<td class="p-1.5 text-center text-slate-400">${escapeHtml(row.extra ?? "")}</td>` : ""}
      ${row.values.map((value, index) => cell(value, `${row.label} · ${JUDGE_CATEGORIES[index]}: ${value.toFixed(2)} / ${CATEGORY_MAX}`)).join("")}
      <td class="p-1.5 pl-3 text-right font-bold text-amber-400 whitespace-nowrap">${escapeHtml(row.summary)}</td>
    </tr>
  `;

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full min-w-[640px] table-fixed text-[11px] border-separate border-spacing-0">
        <colgroup>
          <col class="w-44" />
          ${extraHeader ? '<col class="w-16" />' : ""}
          ${JUDGE_CATEGORIES.map(() => "<col />").join("")}
          <col class="w-20" />
        </colgroup>
        <thead>
          <tr class="text-[10px] uppercase tracking-wider text-slate-500">
            <th scope="col" class="p-1.5 text-left">${escapeHtml(firstHeader)}</th>
            ${extraHeader ? `<th scope="col" class="p-1.5 text-center">${escapeHtml(extraHeader)}</th>` : ""}
            ${JUDGE_CATEGORIES.map((name) => `<th scope="col" class="p-1.5 text-center">${escapeHtml(name)}</th>`).join("")}
            <th scope="col" class="p-1.5 pl-3 text-right">${escapeHtml(lastHeader)}</th>
          </tr>
        </thead>
        <tbody>${rows.map((row) => renderRow(row)).join("")}</tbody>
        ${footer ? `<tfoot>${renderRow(footer, true)}</tfoot>` : ""}
      </table>
    </div>
    ${heatLegend()}
  `;
}

function renderValueChart(container, ratedCafes) {
  if (!container) return;
  const points = ratedCafes
    .map(({ cafe, stats }) => {
      const price = parseCafePrice(cafe.pricePils);
      if (price === null || price <= 0) return null;
      return {
        name: cafe.displayName || cafe.name,
        price,
        percent: stats.percent,
        value: stats.percent / price,
      };
    })
    .filter(Boolean);
  if (!points.length) {
    container.innerHTML =
      '<p class="text-xs text-slate-500">Er zijn nog geen cafés met zowel een score als een pilsprijs.</p>';
    return;
  }

  const ranked = [...points].sort((a, b) => b.value - a.value);
  const topNames = new Set(ranked.slice(0, 3).map((point) => point.name));
  const [xMin, xMax] = paddedRange(points.map((p) => p.price), 0.5, 0);
  const [yMin, yMax] = paddedRange(points.map((p) => p.percent), 10, 0, 100);
  const meanPrice = points.reduce((s, p) => s + p.price, 0) / points.length;
  const meanScore = points.reduce((s, p) => s + p.percent, 0) / points.length;

  const width = 640;
  const height = 340;
  const pad = { top: 16, right: 24, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const x = (v) => pad.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const y = (v) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const xTicks = [];
  for (let t = xMin; t <= xMax + 1e-9; t += 0.5) xTicks.push(t);
  const yTicks = [];
  for (let t = yMin; t <= yMax + 1e-9; t += 10) yTicks.push(t);

  const grid = `
    ${xTicks.map((t) => `<line x1="${x(t)}" y1="${pad.top}" x2="${x(t)}" y2="${pad.top + plotH}" stroke="#1e293b" /><text x="${x(t)}" y="${pad.top + plotH + 20}" text-anchor="middle" fill="#64748b" font-size="12">${formatEuro(t)}</text>`).join("")}
    ${yTicks.map((t) => `<line x1="${pad.left}" y1="${y(t)}" x2="${pad.left + plotW}" y2="${y(t)}" stroke="#1e293b" /><text x="${pad.left - 8}" y="${y(t) + 4}" text-anchor="end" fill="#64748b" font-size="12">${t}%</text>`).join("")}
  `;
  const means = `
    <line x1="${x(meanPrice)}" y1="${pad.top}" x2="${x(meanPrice)}" y2="${pad.top + plotH}" stroke="#94a3b8" stroke-dasharray="5 4" />
    <line x1="${pad.left}" y1="${y(meanScore)}" x2="${pad.left + plotW}" y2="${y(meanScore)}" stroke="#94a3b8" stroke-dasharray="5 4" />
    <text x="${pad.left + 6}" y="${pad.top + 14}" fill="#34d399" font-size="12" font-weight="700">Goedkoop &amp; goed</text>
    <text x="${pad.left + plotW - 6}" y="${pad.top + plotH - 8}" text-anchor="end" fill="#fb7185" font-size="12" font-weight="700">Duur &amp; minder</text>
  `;
  const dots = points
    .map((point) => {
      const isTop = topNames.has(point.name);
      return `
        <circle cx="${x(point.price)}" cy="${y(point.percent)}" r="7" fill="${isTop ? "#34d399" : "#f59e0b"}" fill-opacity="0.9" stroke="#0f172a" stroke-width="2">
          <title>${escapeHtml(point.name)}: ${point.percent.toFixed(2)}% voor ${formatEuro(point.price)}</title>
        </circle>
      `;
    })
    .join("");
  const labels = points
    .filter((point) => topNames.has(point.name))
    .map((point) => {
      const cx = x(point.price);
      const cy = y(point.percent);
      const labelRight = cx < width - 170;
      return `<text x="${labelRight ? cx + 11 : cx - 11}" y="${cy - 8}" text-anchor="${labelRight ? "start" : "end"}" fill="#e2e8f0" font-size="12" stroke="#0f172a" stroke-width="4" paint-order="stroke">${escapeHtml(point.name)}</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg class="w-full h-auto" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="value-chart-title value-chart-desc">
      <title id="value-chart-title">Pilsprijs tegenover jury-score</title>
      <desc id="value-chart-desc">${points.map((p) => `${escapeHtml(p.name)}: ${formatEuro(p.price)}, ${p.percent.toFixed(2)}%`).join(", ")}</desc>
      <g aria-hidden="true">
        ${grid}
        ${means}
        ${dots}
        ${labels}
      </g>
    </svg>
    <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-3 mb-2">Beste waar voor je geld</p>
    <ol class="space-y-1.5">
      ${ranked
        .slice(0, 3)
        .map(
          (point, index) => `
            <li class="flex items-center justify-between gap-3 text-[11px]">
              <span class="text-slate-300 truncate"><span class="text-emerald-400 font-bold mr-1">${index + 1}.</span>${escapeHtml(point.name)}</span>
              <span class="text-slate-400 shrink-0">${point.percent.toFixed(1)}% · ${formatEuro(point.price)} · <span class="text-emerald-400 font-bold">${point.value.toFixed(1)} %-punt per euro</span></span>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

function renderScoreTimeline(container, ratedCafes) {
  if (!container) return;
  const visits = ratedCafes
    .map(({ cafe, stats }) => ({
      name: cafe.displayName || cafe.name,
      date: parseCafeVisitDate(cafe.visitDate),
      percent: stats.percent,
    }))
    .filter((visit) => visit.date)
    .sort((a, b) => a.date - b.date || a.name.localeCompare(b.name));
  if (!visits.length) {
    container.innerHTML =
      '<p class="text-xs text-slate-500">Er zijn nog geen beoordeelde bezoeken met een datum.</p>';
    return;
  }

  let runningTotal = 0;
  visits.forEach((visit, index) => {
    runningTotal += visit.percent;
    visit.runningAverage = runningTotal / (index + 1);
  });

  const width = 640;
  const height = 300;
  const pad = { top: 16, right: 24, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const [yMin, yMax] = paddedRange(visits.map((v) => v.percent), 10, 0, 100);
  const x = (i) =>
    pad.left + (visits.length === 1 ? plotW / 2 : (i / (visits.length - 1)) * plotW);
  const y = (v) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  const dateLabel = (date) =>
    date.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" });
  const labelEvery = Math.ceil(visits.length / 12);

  const yTicks = [];
  for (let t = yMin; t <= yMax + 1e-9; t += 10) yTicks.push(t);
  const grid = yTicks
    .map(
      (t) =>
        `<line x1="${pad.left}" y1="${y(t)}" x2="${pad.left + plotW}" y2="${y(t)}" stroke="#1e293b" /><text x="${pad.left - 8}" y="${y(t) + 4}" text-anchor="end" fill="#64748b" font-size="12">${t}%</text>`,
    )
    .join("");
  const xLabels = visits
    .map((visit, i) =>
      i % labelEvery === 0
        ? `<text x="${x(i)}" y="${pad.top + plotH + 20}" text-anchor="middle" fill="#64748b" font-size="11">${dateLabel(visit.date)}</text>`
        : "",
    )
    .join("");
  const line = (key) => visits.map((v, i) => `${x(i)},${y(v[key])}`).join(" ");
  const dots = visits
    .map(
      (visit, i) => `
        <circle cx="${x(i)}" cy="${y(visit.percent)}" r="5.5" fill="#f59e0b" stroke="#0f172a" stroke-width="2">
          <title>${escapeHtml(visit.name)} (${visit.date.toLocaleDateString("nl-BE")}): ${visit.percent.toFixed(2)}%</title>
        </circle>
      `,
    )
    .join("");
  const best = visits.reduce((a, b) => (b.percent > a.percent ? b : a));
  const latest = visits[visits.length - 1];

  container.innerHTML = `
    <svg class="w-full h-auto" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="timeline-chart-title timeline-chart-desc">
      <title id="timeline-chart-title">Seizoensverloop van de jury-scores</title>
      <desc id="timeline-chart-desc">${visits.map((v) => `${v.date.toLocaleDateString("nl-BE")} ${escapeHtml(v.name)}: ${v.percent.toFixed(2)}%`).join(", ")}</desc>
      <g aria-hidden="true">
        ${grid}
        ${xLabels}
        <polyline points="${line("percent")}" fill="none" stroke="#f59e0b" stroke-opacity="0.5" stroke-width="2" />
        <polyline points="${line("runningAverage")}" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6 4" />
        ${dots}
      </g>
    </svg>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-400">
      <span class="inline-flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>Score per bezoek</span>
      <span class="inline-flex items-center gap-1.5"><span class="inline-block w-4 border-t-2 border-dashed border-slate-200"></span>Lopend gemiddelde ${latest.runningAverage.toFixed(2)}%</span>
      <span>Hoogste: ${escapeHtml(best.name)} (${best.percent.toFixed(2)}%)</span>
    </div>
  `;
}

function renderCategoryHeatmap(container, ratedCafes) {
  if (!container) return;
  if (!ratedCafes.length) {
    container.innerHTML = EMPTY_SCORE_MESSAGE;
    return;
  }
  const rows = ratedCafes.map(({ cafe, stats }) => ({
    label: cafe.displayName || cafe.name,
    values: stats.categoryAverages,
    summary: `${stats.percent.toFixed(1)}%`,
  }));
  const footer = {
    label: "Gemiddelde",
    values: JUDGE_CATEGORIES.map(
      (_, index) =>
        ratedCafes.reduce((sum, entry) => sum + entry.stats.categoryAverages[index], 0) /
        ratedCafes.length,
    ),
    summary: `${(ratedCafes.reduce((sum, entry) => sum + entry.stats.percent, 0) / ratedCafes.length).toFixed(1)}%`,
  };
  renderHeatTable(container, "Café", null, "Totaal", rows, footer);
}

function renderConsensusChart(container, ratedCafes) {
  if (!container) return;
  const totalMax = JUDGE_CATEGORIES.length * CATEGORY_MAX;
  const rows = ratedCafes
    .map(({ cafe }) => {
      const judges = getValidJudges(cafe).map((judge) => ({
        initials: judge.initials.trim(),
        percent: (judge.scores.reduce((sum, score) => sum + score, 0) / totalMax) * 100,
      }));
      if (judges.length < 2) return null;
      const percents = judges.map((judge) => judge.percent);
      return {
        name: cafe.displayName || cafe.name,
        judges,
        min: Math.min(...percents),
        max: Math.max(...percents),
        spread: standardDeviation(percents),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.spread - b.spread || a.name.localeCompare(b.name));
  if (!rows.length) {
    container.innerHTML =
      '<p class="text-xs text-slate-500">Er zijn nog geen cafés met minstens twee juryleden.</p>';
    return;
  }

  const [axisMin, axisMax] = paddedRange(
    rows.flatMap((row) => [row.min, row.max]),
    10,
    0,
    100,
  );
  const pos = (value) => ((value - axisMin) / (axisMax - axisMin)) * 100;
  const most = rows[0];
  const least = rows[rows.length - 1];
  const highlight = (label, row, accent) => `
    <div class="bg-slate-950/40 border border-slate-800 rounded-xl p-3 min-w-0">
      <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500">${label}</p>
      <p class="text-sm font-extrabold ${accent} mt-1 truncate" title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</p>
      <p class="text-[10px] text-slate-500 mt-1">Spreiding ±${row.spread.toFixed(1)} %-punt</p>
    </div>
  `;

  container.innerHTML = `
    <div class="grid grid-cols-2 gap-3 mb-5">
      ${highlight("Meest eensgezind", most, "text-emerald-400")}
      ${highlight("Meest verdeeld", least, "text-rose-400")}
    </div>
    <ol class="space-y-3">
      ${rows
        .map((row) => {
          const safeName = escapeHtml(row.name);
          return `
            <li>
              <div class="flex items-center justify-between gap-3 mb-1">
                <span class="text-[11px] text-slate-300 truncate" title="${safeName}">${safeName}</span>
                <span class="text-[11px] text-slate-400 shrink-0">${row.min.toFixed(0)}–${row.max.toFixed(0)}% · ±${row.spread.toFixed(1)}</span>
              </div>
              <div class="relative h-3 rounded-full bg-slate-800" role="img" aria-label="${safeName}: ${row.judges.map((j) => `${escapeHtml(j.initials)} ${j.percent.toFixed(0)}%`).join(", ")}">
                <div class="absolute inset-y-0 rounded-full bg-amber-500/25" style="left: ${pos(row.min)}%; width: ${pos(row.max) - pos(row.min)}%"></div>
                ${row.judges
                  .map(
                    (judge) => `<span class="absolute top-1/2 w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-amber-400 border border-slate-950" style="left: ${pos(judge.percent)}%" title="${escapeHtml(judge.initials)}: ${judge.percent.toFixed(1)}%"></span>`,
                  )
                  .join("")}
              </div>
            </li>
          `;
        })
        .join("")}
    </ol>
    <div class="flex justify-between text-[10px] text-slate-600 mt-2"><span>${axisMin}%</span><span>${axisMax}%</span></div>
  `;
}

function renderJudgeProfile(container, ratedCafes) {
  if (!container) return;
  const profiles = new Map();
  ratedCafes.forEach(({ cafe }) => {
    getValidJudges(cafe).forEach((judge) => {
      const initials = judge.initials.trim();
      const profile = profiles.get(initials) || {
        sums: JUDGE_CATEGORIES.map(() => 0),
        cafeCount: 0,
      };
      JUDGE_CATEGORIES.forEach((_, index) => {
        profile.sums[index] += Number(judge.scores[index]) || 0;
      });
      profile.cafeCount += 1;
      profiles.set(initials, profile);
    });
  });
  if (!profiles.size) {
    container.innerHTML = EMPTY_SCORE_MESSAGE;
    return;
  }

  const rows = Array.from(profiles, ([initials, profile]) => {
    const values = profile.sums.map((sum) => sum / profile.cafeCount);
    const overall = values.reduce((sum, value) => sum + value, 0) / values.length;
    return {
      label: initials,
      extra: profile.cafeCount,
      values,
      summary: `${overall.toFixed(1)}`,
      cafeCount: profile.cafeCount,
    };
  }).sort((a, b) => b.cafeCount - a.cafeCount || a.label.localeCompare(b.label));
  renderHeatTable(container, "Jurylid", "Cafés", "Gem.", rows);
}

function renderSeasonProgress(container) {
  if (!container) return;
  const total = cafesList.length;
  const visited = cafesList.filter((cafe) => cafe.rated);
  const remaining = total - visited.length;
  const percent = total ? (visited.length / total) * 100 : 0;
  const dates = visited
    .map((cafe) => parseCafeVisitDate(cafe.visitDate))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const months = [];
  if (dates.length) {
    const cursor = new Date(dates[0].getFullYear(), dates[0].getMonth(), 1);
    const last = dates[dates.length - 1];
    while (cursor <= last) {
      months.push({
        date: new Date(cursor),
        count: dates.filter(
          (date) =>
            date.getFullYear() === cursor.getFullYear() &&
            date.getMonth() === cursor.getMonth(),
        ).length,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  const maxMonth = Math.max(1, ...months.map((month) => month.count));
  const pace = months.length ? dates.length / months.length : 0;
  let projection = "Nog geen bezoeken met een datum om een tempo te berekenen.";
  if (remaining === 0) {
    projection = "Alle cafés uit de lijst zijn bezocht. Schol!";
  } else if (pace > 0) {
    const monthsNeeded = Math.ceil(remaining / pace);
    const lastDate = dates[dates.length - 1];
    const finish = new Date(lastDate.getFullYear(), lastDate.getMonth() + monthsNeeded, 1);
    projection = `Aan dit tempo is de lijst rond in <span class="font-bold text-white">${finish.toLocaleDateString("nl-BE", { month: "long", year: "numeric" })}</span> (nog ${monthsNeeded} ${monthsNeeded === 1 ? "maand" : "maanden"}).`;
  }

  container.innerHTML = `
    <div class="flex items-end justify-between gap-3 mb-2">
      <p class="text-2xl font-extrabold text-white">${visited.length} <span class="text-sm font-bold text-slate-500">/ ${total} bezocht</span></p>
      <p class="text-sm font-bold text-amber-400">${percent.toFixed(0)}%</p>
    </div>
    <div class="h-3 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-label="Seizoensvoortgang" aria-valuenow="${visited.length}" aria-valuemin="0" aria-valuemax="${total}">
      <div class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400" style="width: ${percent}%"></div>
    </div>
    <p class="text-[11px] text-slate-500 mt-2">Nog ${remaining} ${remaining === 1 ? "café" : "cafés"} te gaan · gemiddeld ${pace.toFixed(1).replace(".", ",")} bezoeken per maand</p>
    <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-5 mb-2">Bezoeken per maand</p>
    <ol class="space-y-2">
      ${months
        .map(
          ({ date, count }) => `
            <li class="flex items-center gap-3 text-[11px]">
              <span class="w-20 shrink-0 text-slate-300 capitalize">${date.toLocaleDateString("nl-BE", { month: "short", year: "2-digit" })}</span>
              <div class="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400" style="width: ${(count / maxMonth) * 100}%"></div>
              </div>
              <span class="w-6 shrink-0 text-right font-bold text-amber-400">${count}</span>
            </li>
          `,
        )
        .join("")}
    </ol>
    <p class="text-[11px] text-slate-400 mt-4">${projection}</p>
  `;
}

function renderJudgeAttendanceChart(container, judges, visitCount) {
  if (!container) return;
  if (!judges.length || !visitCount) {
    container.innerHTML =
      '<p class="text-xs text-slate-500">Er zijn nog geen jurybeoordelingen beschikbaar.</p>';
    return;
  }

  const attendance = [...judges].sort(
    (a, b) => b.cafeCount - a.cafeCount || a.initials.localeCompare(b.initials),
  );
  const maxCount = attendance[0].cafeCount;
  const minCount = attendance[attendance.length - 1].cafeCount;
  const cafeLabel = (count) => `${count} ${count === 1 ? "café" : "cafés"}`;
  const initialsWith = (count) =>
    attendance
      .filter((judge) => judge.cafeCount === count)
      .map((judge) => judge.initials)
      .join(", ");
  const highlight = (label, initials, count, accent) => `
    <div class="bg-slate-950/40 border border-slate-800 rounded-xl p-3 min-w-0">
      <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500">${label}</p>
      <p class="text-base font-extrabold ${accent} mt-1 break-words">${escapeHtml(initials)}</p>
      <p class="text-[10px] text-slate-500 mt-1">${cafeLabel(count)} van ${visitCount} (${Math.round((count / visitCount) * 100)}%)</p>
    </div>
  `;

  container.innerHTML = `
    <div class="grid grid-cols-2 gap-3 mb-5">
      ${highlight("Meest aanwezig", initialsWith(maxCount), maxCount, "text-emerald-400")}
      ${highlight("Minst aanwezig", initialsWith(minCount), minCount, "text-rose-400")}
    </div>
    <ol class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      ${attendance
        .map(({ initials, cafeCount }) => {
          const safeInitials = escapeHtml(initials);
          const width = (cafeCount / visitCount) * 100;
          const isMost = cafeCount === maxCount;
          const isLeast = cafeCount === minCount && !isMost;
          const barColor = isMost
            ? "from-emerald-600 to-emerald-400"
            : isLeast
              ? "from-rose-600 to-rose-400"
              : "from-amber-600 to-amber-400";
          const countColor = isMost
            ? "text-emerald-400"
            : isLeast
              ? "text-rose-400"
              : "text-amber-400";
          return `
            <li>
              <div class="flex items-center justify-between gap-3 mb-1">
                <span class="text-[11px] font-bold text-slate-300">${safeInitials}</span>
                <span class="text-[11px] font-bold ${countColor} shrink-0">${cafeLabel(cafeCount)}</span>
              </div>
              <div
                class="h-2 rounded-full bg-slate-800 overflow-hidden"
                role="progressbar"
                aria-label="Aanwezigheid ${safeInitials}"
                aria-valuenow="${cafeCount}"
                aria-valuemin="0"
                aria-valuemax="${visitCount}"
              >
                <div class="h-full rounded-full bg-gradient-to-r ${barColor}" style="width: ${width}%"></div>
              </div>
            </li>
          `;
        })
        .join("")}
    </ol>
    <div class="flex justify-between text-[10px] text-slate-600 mt-2"><span>0</span><span>${visitCount} beoordeelde cafés</span></div>
  `;
}

function renderCafeAnalytics() {
  const summary = document.getElementById("cafe-analytics-summary");
  const scoreChart = document.getElementById("cafe-score-chart");
  const categoryChart = document.getElementById("cafe-category-chart");
  if (!summary || !scoreChart || !categoryChart) return;

  const ratedCafes = cafesList
    .filter(
      (cafe) =>
        cafe.rated && String(cafe.score || "").trim().toUpperCase() !== "NVT",
    )
    .map((cafe) => ({ cafe, stats: computeScoreStats(cafe) }))
    .filter((entry) => entry.stats)
    .sort((a, b) => b.stats.percent - a.stats.percent);
  const averageScore = ratedCafes.length
    ? ratedCafes.reduce((sum, entry) => sum + entry.stats.percent, 0) /
      ratedCafes.length
    : null;
  const completion = cafesList.length
    ? (ratedCafes.length / cafesList.length) * 100
    : 0;
  const leader = ratedCafes[0];
  const priceObservations = (field) =>
    cafesList
      .map((cafe) => {
        const price = parseCafePrice(cafe[field]);
        if (price === null) return null;
        return { name: cafe.displayName || cafe.name, price };
      })
      .filter(Boolean);
  const pilsPrices = priceObservations("pricePils");
  const piconPrices = priceObservations("pricePicon");
  const averagePrice = (observations) =>
    observations.length
      ? observations.reduce((sum, entry) => sum + entry.price, 0) /
        observations.length
      : null;
  const pilsAverage = averagePrice(pilsPrices);
  const piconAverage = averagePrice(piconPrices);

  const judgeTotals = new Map();
  ratedCafes.forEach(({ cafe }) => {
    cafe.judges.forEach((judge) => {
      const initials = judge.initials.trim();
      if (!initials || initials === "--") return;
      const scores = judge.scores.filter(Number.isFinite);
      if (!scores.length) return;

      const total = scores.reduce((sum, score) => sum + score, 0);
      const entry = judgeTotals.get(initials) || {
        total: 0,
        cafeCount: 0,
      };
      entry.total += total / scores.length;
      entry.cafeCount += 1;
      judgeTotals.set(initials, entry);
    });
  });
  const judgeAverages = Array.from(judgeTotals, ([initials, entry]) => ({
    initials,
    average: entry.total / entry.cafeCount,
    cafeCount: entry.cafeCount,
  })).sort(
    (a, b) =>
      a.average - b.average || a.initials.localeCompare(b.initials),
  );
  const strictestJudge = judgeAverages[0];
  const leastStrictJudge = judgeAverages[judgeAverages.length - 1];
  const metricCard = (label, value, detail) => `
    <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-3 sm:p-4 min-w-0">
      <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500">${escapeHtml(label)}</p>
      <p class="text-lg sm:text-xl font-extrabold text-white mt-1 break-words" title="${escapeHtml(value)}">${escapeHtml(value)}</p>
      <p class="text-[10px] text-slate-500 mt-1 truncate">${escapeHtml(detail)}</p>
    </div>
  `;

  summary.innerHTML = [
    metricCard("Cafés in de lijst", cafesList.length, "In het overzicht"),
    metricCard(
      "Scores toegekend",
      `${ratedCafes.length} / ${cafesList.length}`,
      `${completion.toFixed(0)}% met een jury-score`,
    ),
    metricCard(
      "Gemiddelde score",
      averageScore === null ? "—" : `${averageScore.toFixed(2)}%`,
      "Gemiddelde van de caféscores",
    ),
    metricCard(
      "Koploper",
      leader ? leader.cafe.displayName || leader.cafe.name : "Nog geen score",
      leader
        ? `${leader.stats.percent.toFixed(2)}% jury-score`
        : "Beoordeel een café om te starten",
    ),
    metricCard(
      "Gemiddelde pilsprijs",
      pilsAverage === null ? "—" : formatEuro(pilsAverage),
      `${pilsPrices.length} cafés met een bekende prijs`,
    ),
    metricCard(
      "Gemiddelde piconprijs",
      piconAverage === null ? "—" : formatEuro(piconAverage),
      `${piconPrices.length} cafés met een bekende prijs`,
    ),
    metricCard(
      "Strengste jurylid",
      strictestJudge
        ? `${strictestJudge.initials} · ${strictestJudge.average.toFixed(2)} / ${CATEGORY_MAX}`
        : "Nog geen scores",
      strictestJudge
        ? `Gemiddelde over ${strictestJudge.cafeCount} ${strictestJudge.cafeCount === 1 ? "café" : "cafés"}`
        : "Geen jurydata beschikbaar",
    ),
    metricCard(
      "Minst strenge jurylid",
      leastStrictJudge
        ? `${leastStrictJudge.initials} · ${leastStrictJudge.average.toFixed(2)} / ${CATEGORY_MAX}`
        : "Nog geen scores",
      leastStrictJudge
        ? `Gemiddelde over ${leastStrictJudge.cafeCount} ${leastStrictJudge.cafeCount === 1 ? "café" : "cafés"}`
        : "Geen jurydata beschikbaar",
    ),
  ].join("");

  if (!ratedCafes.length) {
    const emptyMessage =
      '<p class="text-xs text-slate-500">Er zijn nog geen jurybeoordelingen beschikbaar.</p>';
    scoreChart.innerHTML = emptyMessage;
    categoryChart.innerHTML = emptyMessage;
  } else {
    scoreChart.innerHTML = `
      <ol class="space-y-3">
        ${ratedCafes
          .map(({ cafe, stats }) => {
            const name = cafe.displayName || cafe.name;
            const width = Math.max(0, Math.min(100, stats.percent));
            const safeName = escapeHtml(name);
            return `
              <li>
                <div class="flex items-center justify-between gap-3 mb-1">
                  <span class="text-[11px] text-slate-300 truncate" title="${safeName}">${safeName}</span>
                  <span class="text-[11px] font-bold text-amber-400 shrink-0">${stats.percent.toFixed(2)}%</span>
                </div>
                <div
                  class="h-2 rounded-full bg-slate-800 overflow-hidden"
                  role="progressbar"
                  aria-label="Score ${safeName}"
                  aria-valuenow="${stats.percent.toFixed(2)}"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400" style="width: ${width}%"></div>
                </div>
              </li>
            `;
          })
          .join("")}
      </ol>
      <div class="flex justify-between text-[10px] text-slate-600 mt-2"><span>0%</span><span>100%</span></div>
    `;

    const categoryAverages = JUDGE_CATEGORIES.map((name, index) => ({
      name,
      average:
        ratedCafes.reduce(
          (sum, entry) => sum + entry.stats.categoryAverages[index],
          0,
        ) / ratedCafes.length,
    }));
    categoryChart.innerHTML = `
      <ol class="space-y-4">
        ${categoryAverages
          .map(({ name, average }) => {
            const width = Math.max(
              0,
              Math.min(100, (average / CATEGORY_MAX) * 100),
            );
            return `
              <li>
                <div class="flex items-center justify-between gap-3 mb-1">
                  <span class="text-[11px] text-slate-300">${escapeHtml(name)}</span>
                  <span class="text-[11px] font-bold text-amber-400 shrink-0">${average.toFixed(1)} / ${CATEGORY_MAX}</span>
                </div>
                <div
                  class="h-2 rounded-full bg-slate-800 overflow-hidden"
                  role="progressbar"
                  aria-label="Gemiddelde score ${escapeHtml(name)}"
                  aria-valuenow="${average.toFixed(1)}"
                  aria-valuemin="0"
                  aria-valuemax="${CATEGORY_MAX}"
                >
                  <div class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400" style="width: ${width}%"></div>
                </div>
              </li>
            `;
          })
          .join("")}
      </ol>
      <div class="flex justify-between text-[10px] text-slate-600 mt-2"><span>0</span><span>${CATEGORY_MAX}</span></div>
    `;
  }

  renderJudgeAttendanceChart(
    document.getElementById("cafe-judge-attendance-chart"),
    judgeAverages,
    ratedCafes.length,
  );
  renderValueChart(document.getElementById("cafe-value-chart"), ratedCafes);
  renderScoreTimeline(document.getElementById("cafe-timeline-chart"), ratedCafes);
  renderCategoryHeatmap(document.getElementById("cafe-category-heatmap"), ratedCafes);
  renderConsensusChart(document.getElementById("cafe-consensus-chart"), ratedCafes);
  renderJudgeProfile(document.getElementById("cafe-judge-profile"), ratedCafes);
  renderSeasonProgress(document.getElementById("cafe-progress-chart"));

  renderPriceDotPlot(
    document.getElementById("cafe-pils-price-chart"),
    "pils-price-chart",
    "Pilsprijs",
    pilsPrices,
    "#f59e0b",
  );
  renderPriceDotPlot(
    document.getElementById("cafe-picon-price-chart"),
    "picon-price-chart",
    "Piconprijs",
    piconPrices,
    "#a78bfa",
  );
}

/**
 * Vult de detailpagina van een beoordeeld café (header, fiche, juryverslag,
 * categoriescores en jurytabel) op basis van de data in cafesList
 */
function renderCafeDetailContent(cafe) {
  const stats = computeScoreStats(cafe);
  if (!stats) return;

  const slug = getCafeSlug(cafe);
  const container = document.getElementById(`detail-content-${slug}`);
  if (!container) return;

  const displayName = cafe.displayName || cafe.name;
  const address = cafe.address || cafe.location;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    cafe.mapsQuery || `${displayName} ${address}`,
  )}`;
  const percentText = `${stats.percent.toFixed(2)}%`;

  const piconFiche = cafe.pricePicon
    ? `
      <div class="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
        <div class="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
          <i data-lucide="glass-water" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prijs Picon</span>
          <span class="text-sm font-bold text-white">${cafe.pricePicon}</span>
        </div>
      </div>`
    : `
      <div class="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
        <div class="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
          <i data-lucide="glass-water" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prijs Picon</span>
          <span class="text-xs font-bold text-rose-400/80 uppercase">Niet beschikbaar</span>
        </div>
      </div>`;

  const reportBlock = cafe.report
    ? `
      <div class="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
        <div class="flex items-start gap-4 relative z-10">
          <div class="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl mt-0.5">
            <i data-lucide="message-square" class="w-5 h-5"></i>
          </div>
          <div class="space-y-1.5">
            <span class="block text-[10px] text-amber-500 uppercase font-extrabold tracking-wider">Juryverslag & Sfeerimpressie</span>
            <p class="text-slate-200 text-sm leading-relaxed">${cafe.report}</p>
          </div>
        </div>
      </div>`
    : "";

  const categoriesGrid = JUDGE_CATEGORIES.map(
    (label, index) => `
      <div class="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
        <span class="block text-xs text-slate-500 font-semibold mb-1">${label}</span>
        <span class="text-xl font-bold text-white">${stats.categoryAverages[index].toFixed(1)}</span>
        <span class="text-[10px] text-slate-500 block">/ ${CATEGORY_MAX}</span>
      </div>`,
  ).join("");

  const categoryHeaders = JUDGE_CATEGORIES.map(
    (label) => `<th class="p-4 text-center">${label}</th>`,
  ).join("");

  const judgeRows = stats.judges
    .map(
      (judge) => `
      <tr class="hover:bg-slate-900/20">
        <td class="p-4 font-bold text-white">${judge.initials}</td>
        ${judge.scores.map((score) => `<td class="p-4 text-center">${score}</td>`).join("")}
        <td class="p-4 text-right font-semibold">${judge.total}</td>
        <td class="p-4 text-right text-amber-500 font-semibold">${judge.percent.toFixed(2)}%</td>
      </tr>`,
    )
    .join("");

  const categoryAverageCells = stats.categoryAverages
    .map(
      (avg) =>
        `<td class="p-4 text-center text-amber-400">${avg.toFixed(1)}</td>`,
    )
    .join("");

  container.innerHTML = `
    <!-- Cafe Header -->
    <div class="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Bezocht
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-500"></i>
              <span>Bezocht op ${cafe.visitDate}</span>
            </span>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-white">${displayName}</h1>

          <!-- Google Maps Link -->
          <a
            href="${mapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-400 hover:text-amber-400 text-sm mt-2.5 inline-flex items-center gap-1.5 transition-colors group/link"
            title="Open in Google Maps"
          >
            <i data-lucide="map-pin" class="w-4 h-4 text-slate-500 group-hover/link:text-amber-500 transition-colors"></i>
            <span class="underline decoration-slate-700 group-hover/link:decoration-amber-400">${address}</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5 opacity-50 group-hover/link:opacity-100 transition-opacity"></i>
          </a>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-xl text-center min-w-[140px]">
          <span class="block text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Eindscore</span>
          <span class="text-3xl font-black text-amber-400">${percentText}</span>
          <span class="block text-[10px] text-slate-400 mt-0.5">${stats.totalPoints.toFixed(1)} / ${stats.totalMax} ptn</span>
        </div>
      </div>
    </div>

    <!-- Practical Details Fiche -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <!-- Plaats -->
      <div class="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
        <div class="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
          <i data-lucide="map" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Locatie in café</span>
          <span class="text-sm font-bold text-white">${cafe.seating || "Onbekend"}</span>
        </div>
      </div>
      <!-- Prijs Pils -->
      <div class="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
        <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <i data-lucide="beer" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prijs Pils</span>
          <span class="text-sm font-bold text-white">${cafe.pricePils || "Onbekend"}</span>
        </div>
      </div>
      <!-- Prijs Picon -->
      ${piconFiche}
    </div>

    ${reportBlock}

    <!-- Score Categories Grid -->
    <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
      Gemiddelde scores per categorie
    </h2>
    <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      ${categoriesGrid}
    </div>

    <!-- Detailed Score Table -->
    <div class="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden mb-8">
      <div class="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/50">
        <div>
          <h3 class="font-bold text-white text-base">Gedetailleerde Jurybeoordeling</h3>
          <p class="text-xs text-slate-500">Individuele scores van onze proeverij (max. ${CATEGORY_MAX} per categorie)</p>
        </div>
      </div>

      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase bg-slate-950/40">
              <th class="p-4">Persoon</th>
              ${categoryHeaders}
              <th class="p-4 text-right">Totaal (${stats.totalMax})</th>
              <th class="p-4 text-right">Procent</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            ${judgeRows}
          </tbody>
          <tfoot>
            <tr class="border-t border-slate-800 text-white font-bold bg-slate-950/60">
              <td class="p-4">Gemiddelde</td>
              ${categoryAverageCells}
              <td class="p-4 text-right text-amber-400">${stats.totalPoints.toFixed(1)}</td>
              <td class="p-4 text-right text-amber-400">${percentText}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  lucide.createIcons();
}

/**
 * Rendert de detailpagina's van alle beoordeelde cafés
 */
function renderCafeDetailPages() {
  cafesList
    .filter((cafe) => cafe.rated)
    .forEach((cafe) => renderCafeDetailContent(cafe));
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
  if (pageId === "overview" && cafeMap) {
    cafeMap.closePopup();
    cafeMap.invalidateSize();
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
    if (radarText) radarText.innerText = "42 caafés... of wa-ren 't er 50?";
    if (seasonBadge)
      seasonBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Zatlap Modus Actief!`;
    if (leaderboardTitle)
      leaderboardTitle.innerHTML = `<i data-lucide="beer" class="w-4 h-4 text-amber-500 animate-bounce"></i> De s-snelste stijger!`;

    console.log("Zatlap modus geactiveerd! Schol!");
  } else {
    body.classList.remove("drunk");

    if (subtitle) subtitle.innerText = "Groot-Waregemse Caféwijzer";
    if (heroTitle) heroTitle.innerHTML = "De Waregemse Donderdagtraditie";
    if (heroDesc)
      heroDesc.innerText =
        "Elke donderdag trekken we op pad om de lokale staminees in Groot-Waregem te keuren. Enkel echte cafés uit Waregem en de deelgemeentes Beveren-Leie, Desselgem, Nieuwenhove en Sint-Eloois-Vijve komen in aanmerking!";
    if (searchInput) searchInput.placeholder = "Zoek café...";
    if (radarText) radarText.innerText = "42 Groot-Waregemse cafés op de radar";
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
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadCafesList();
  } catch (error) {
    console.error(error);
  }
  renderCafes();
  renderNextVisitBanner();
  renderLeaderboard();
  renderCafeAnalytics();
  renderCafeDetailPages();
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

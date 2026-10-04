/**
 * Donderdagbier.be - Application Logic, Database, Roulette & Easter Eggs
 * Versie: v1.13.0
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

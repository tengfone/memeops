const state = {
  index: null,
  featured: null,
  categories: new Map(),
  entries: null
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getJsonUrl(relativePath) {
  return new URL(relativePath, window.location.href);
}

async function fetchJson(relativePath) {
  const response = await fetch(getJsonUrl(relativePath));

  if (!response.ok) {
    throw new Error(`Failed to load ${relativePath}: ${response.status}`);
  }

  return response.json();
}

async function loadIndex() {
  if (!state.index) {
    state.index = await fetchJson("./api/v1/index.json");
  }

  return state.index;
}

async function loadFeatured() {
  if (!state.featured) {
    state.featured = await fetchJson("./api/v1/featured.json");
  }

  return state.featured;
}

async function loadCategory(categoryId) {
  if (!state.categories.has(categoryId)) {
    state.categories.set(categoryId, fetchJson(`./api/v1/${categoryId}`));
  }

  return state.categories.get(categoryId);
}

async function loadAllEntries() {
  if (state.entries) {
    return state.entries;
  }

  const index = await loadIndex();
  const categoryIndexes = await Promise.all(
    index.categories.map((category) => loadCategory(category.id))
  );

  const categoryLookup = new Map(
    index.categories.map((category) => [category.id, category])
  );

  state.entries = categoryIndexes
    .flatMap((categoryIndex) => categoryIndex.items)
    .map((entry) => ({
      ...entry,
      categoryTitle: categoryLookup.get(entry.category)?.title ?? entry.category,
      categoryAccent: categoryLookup.get(entry.category)?.accent ?? "#d7a24a"
    }));

  return state.entries;
}

function byId(id) {
  return document.getElementById(id);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function fallbackCopyText(text) {
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("aria-hidden", "true");
  temp.style.position = "fixed";
  temp.style.top = "0";
  temp.style.left = "0";
  temp.style.opacity = "0";
  document.body.appendChild(temp);
  temp.focus();
  temp.select();
  temp.setSelectionRange(0, temp.value.length);

  const copied =
    typeof document.execCommand === "function" &&
    document.execCommand("copy");

  temp.remove();

  if (!copied) {
    window.prompt("Copy the text below.", text);
    return false;
  }

  return true;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("Async clipboard write failed, falling back.", error);
    }
  }

  return fallbackCopyText(text);
}

async function applyGlobalStats() {
  const index = await loadIndex();
  const totalEntries = index.categories.reduce(
    (sum, category) => sum + category.count,
    0
  );

  document.querySelectorAll("[data-entry-count]").forEach((node) => {
    node.textContent = String(totalEntries);
  });

  document.querySelectorAll("[data-category-count]").forEach((node) => {
    node.textContent = String(index.categories.length);
  });

  document.querySelectorAll("[data-api-root]").forEach((node) => {
    node.textContent = index.public_api_url;
  });
}

function installCopyButtons() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-target]");

    if (!button) {
      return;
    }

    const targetId = button.getAttribute("data-copy-target");
    const target = targetId ? byId(targetId) : null;

    if (!target) {
      return;
    }

    const previousText = button.textContent;

    try {
      const copied = await copyText(target.textContent ?? "");
      button.textContent = copied ? "Copied" : "Select text";
    } catch (error) {
      console.error(error);
      button.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      button.textContent = previousText;
    }, 1200);
  });
}

function renderCardMeta(entry) {
  return `
    <div class="card-meta">
      <span class="pill">${escapeHtml(entry.categoryTitle ?? entry.category_title ?? entry.category)}</span>
      <span class="pill">${escapeHtml(entry.tone)}</span>
    </div>
  `;
}

function renderTags(tags) {
  return `
    <div class="tag-list">
      ${tags
        .map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`)
        .join("")}
    </div>
  `;
}

function humanizeFieldName(value) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFieldValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : String(value);
  }

  return String(value);
}

function getEntryHighlights(entry) {
  const category = state.index?.categories.find((item) => item.id === entry.category);

  if (!category) {
    return [];
  }

  return category.fields.slice(0, 3).map((field) => [
    humanizeFieldName(field.name),
    formatFieldValue(entry[field.name])
  ]);
}

function renderEntryDetail(entry) {
  const highlights = getEntryHighlights(entry)
    .map(
      ([label, value]) => `
        <div class="entry-kv">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");

  return `
    <div class="entry-header">
      <div>
        <div class="eyebrow">${escapeHtml(entry.categoryTitle ?? entry.category)}</div>
        <h3>${escapeHtml(entry.title)}</h3>
      </div>
      <div class="inline-actions">
        <a class="button button-quiet" href="./docs.html#${escapeHtml(entry.category)}">Schema</a>
      </div>
    </div>
    <p>${escapeHtml(entry.summary)}</p>
    <div class="pill-row">
      <span class="pill">${escapeHtml(entry.categoryTitle ?? entry.category)}</span>
      <span class="pill">${escapeHtml(entry.tone)}</span>
      <span class="pill mono">/api/v1/${escapeHtml(entry.category)}</span>
    </div>
    <div class="entry-meta-grid">${highlights}</div>
  `;
}

function getFetchSnippet(entry) {
  const collectionUrl =
    entry.collection_url ||
    `https://tengfone.github.io/memeops/api/v1/${entry.category}`;

  return `fetch("${collectionUrl}")
  .then((response) => response.json())
  .then((data) => data.items.find((item) => item.id === "${entry.id}"))
  .then((item) => console.log(item));`;
}

function getCollectionFetchSnippet(category) {
  return `fetch("${category.public_url}")
  .then((response) => response.json())
  .then((data) => console.log(data.items));`;
}

function getQuickstartSnippet(index) {
  return `const api = "${index.public_api_url}";

const catalog = await fetch(\`\${api}index.json\`).then((response) => response.json());
const random = await fetch(\`\${api}random\`).then((response) => response.json());
const collectionId = catalog.categories[0].id;
const collection = await fetch(\`\${api}\${collectionId}\`).then((response) => response.json());
const sample = collection.items[Math.floor(Math.random() * collection.items.length)];

console.log(catalog.categories.map((category) => category.id));
console.log(random.item.title);
console.log(sample);`;
}

function renderFieldRows(fields) {
  return fields
    .map((field) => {
      const details = [];

      if (field.enum) {
        details.push(`Allowed: ${field.enum.join(", ")}`);
      }

      if (field.minimum !== undefined || field.maximum !== undefined) {
        details.push(
          `Range: ${field.minimum ?? "-inf"} to ${field.maximum ?? "+inf"}`
        );
      }

      return `
        <div class="field-row">
          <strong>${escapeHtml(field.name)}</strong>
          <span>${escapeHtml(field.type)}${field.itemType ? ` of ${escapeHtml(field.itemType)}` : ""}</span>
          <p>${escapeHtml(field.description)}${details.length > 0 ? ` ${escapeHtml(details.join(" | "))}` : ""}</p>
        </div>
      `;
    })
    .join("");
}

async function renderHomePage() {
  const index = await loadIndex();
  const featured = await loadFeatured();
  const totalEntries = index.categories.reduce(
    (sum, category) => sum + category.count,
    0
  );

  byId("hero-stats").innerHTML = `
    <div class="metric">
      <span class="metric-label">Launch categories</span>
      <span class="metric-value">${index.categories.length}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Curated entries</span>
      <span class="metric-value">${totalEntries}</span>
    </div>
    <div class="metric">
      <span class="metric-label">API version</span>
      <span class="metric-value">${escapeHtml(index.api_version)}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Deployment target</span>
      <span class="metric-value">GitHub Pages</span>
    </div>
  `;

  byId("home-category-grid").innerHTML = index.categories
    .slice(0, 8)
    .map(
      (category) => `
        <article class="card">
          <div class="sample-header">
            <div>
              <div class="eyebrow" style="color:${escapeHtml(category.accent)}">${escapeHtml(category.icon)}</div>
              <h3>${escapeHtml(category.title)}</h3>
            </div>
            <span class="pill">${category.count} entries</span>
          </div>
          <p>${escapeHtml(category.summary)}</p>
          <ul class="note-list">
            ${category.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");

  const sampleTitle = byId("home-sample-title");
  const sampleMeta = byId("home-sample-meta");
  const sampleCode = byId("home-sample-code");
  const sampleFetch = byId("home-fetch-code");

  const paintSample = (entry) => {
    sampleTitle.textContent = entry.title;
    sampleMeta.innerHTML = renderCardMeta(entry);
    sampleCode.textContent = formatJson(entry);
    sampleFetch.textContent = getFetchSnippet(entry);
  };

  paintSample(featured.items[0]);

  byId("home-random-sample").addEventListener("click", () => {
    paintSample(pickRandom(featured.items));
  });
}

async function renderDocsPage() {
  const index = await loadIndex();
  const random = await fetchJson("./api/v1/random");
  const categoryIndexes = await Promise.all(
    index.categories.map((category) => loadCategory(category.id))
  );

  byId("docs-base-url").textContent = index.public_api_url;
  byId("docs-quickstart-code").textContent = getQuickstartSnippet(index);
  byId("docs-random-code").textContent = formatJson(random);
  byId("docs-resource-nav").innerHTML = [
    '<a class="docs-sidebar-link" href="#random-endpoint">/api/v1/random</a>',
    ...index.categories.map(
      (category) =>
        `<a class="docs-sidebar-link" href="#${escapeHtml(category.id)}">/api/v1/${escapeHtml(category.id)}</a>`
    )
  ].join("");

  const sections = index.categories.map((category, position) => {
    const categoryIndex = categoryIndexes[position];
    const sample =
      categoryIndex.items.find((item) => item.id === category.sample_id) ??
      categoryIndex.items[0];
    const jsonId = `${category.id}-example-json`;
    const fetchId = `${category.id}-fetch`;

    return `
      <section class="docs-reference-block" id="${escapeHtml(category.id)}">
        <div class="docs-block-header">
          <div>
            <div class="docs-block-kicker">Collection</div>
            <div class="docs-route-line">
              <span class="docs-method-pill">GET</span>
              <span class="docs-route-path mono">/api/v1/${escapeHtml(category.id)}</span>
            </div>
            <h2 class="docs-resource-title">${escapeHtml(category.title)}</h2>
          </div>
          <div class="docs-link-actions">
            <a class="button button-quiet" href="./${escapeHtml(category.schema)}" target="_blank" rel="noreferrer">Schema</a>
            <a class="button button-quiet" href="./categories.html?category=${escapeHtml(category.id)}#${escapeHtml(sample.id)}">Browse</a>
          </div>
        </div>
        <p class="docs-block-copy">${escapeHtml(category.summary)}</p>
        <div class="docs-resource-meta">
          <span class="pill">${category.count} entries</span>
          <span class="pill">${escapeHtml(category.tone)}</span>
          <span class="pill mono">${escapeHtml(category.path)}</span>
        </div>
        <div class="docs-block-grid">
          <div class="docs-block-column">
            <div class="docs-mini-header">
              <h3>Attributes</h3>
            </div>
            <div class="field-grid">${renderFieldRows(category.fields)}</div>
            <div class="docs-mini-header">
              <h3>Notes</h3>
            </div>
            <ul class="note-list">
              ${category.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
            </ul>
          </div>
          <div class="docs-block-column">
            <div class="docs-code-frame">
              <div class="docs-code-header">
                <h3>Example Response</h3>
                <button class="button button-quiet" type="button" data-copy-target="${jsonId}">Copy JSON</button>
              </div>
              <pre class="code-block" id="${jsonId}">${escapeHtml(formatJson(sample))}</pre>
            </div>
            <div class="docs-code-frame">
              <div class="docs-code-header">
                <h3>Fetch Example</h3>
                <button class="button button-quiet" type="button" data-copy-target="${fetchId}">Copy Fetch</button>
              </div>
              <pre class="code-block" id="${fetchId}">${escapeHtml(getCollectionFetchSnippet(category))}</pre>
            </div>
          </div>
        </div>
      </section>
    `;
  });

  byId("docs-catalog").innerHTML = sections.join("");
}

async function renderCategoriesPage() {
  const entries = await loadAllEntries();
  const maxVisibleResults = 60;
  const categorySelect = byId("category-filter");
  const toneSelect = byId("tone-filter");
  const searchInput = byId("search-filter");
  const resultsHost = byId("results-grid");
  const detailHost = byId("entry-detail");
  const resultCount = byId("results-count");
  const url = new URL(window.location.href);

  const categoryOptions = [
    ["all", "All categories"],
    ...new Map(entries.map((entry) => [entry.category, entry.categoryTitle]))
  ];
  const toneOptions = [
    "all",
    ...new Set(entries.map((entry) => entry.tone).sort((left, right) => left.localeCompare(right)))
  ];

  categorySelect.innerHTML = categoryOptions
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join("");
  toneSelect.innerHTML = toneOptions
    .map((tone) => `<option value="${escapeHtml(tone)}">${tone === "all" ? "All tones" : escapeHtml(tone)}</option>`)
    .join("");

  const filterState = {
    category: url.searchParams.get("category") || "all",
    tone: url.searchParams.get("tone") || "all",
    query: url.searchParams.get("q") || "",
    selectedId: window.location.hash.replace("#", "")
  };

  categorySelect.value = filterState.category;
  toneSelect.value = filterState.tone;
  searchInput.value = filterState.query;

  function syncUrl() {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("category", filterState.category);
    nextUrl.searchParams.set("tone", filterState.tone);
    nextUrl.searchParams.delete("tag");

    if (filterState.query) {
      nextUrl.searchParams.set("q", filterState.query);
    } else {
      nextUrl.searchParams.delete("q");
    }

    nextUrl.hash = filterState.selectedId ? `#${filterState.selectedId}` : "";
    window.history.replaceState({}, "", nextUrl);
  }

  function matchesFilter(entry) {
    const queryTarget = `${entry.title} ${entry.summary}`.toLowerCase();

    return (
      (filterState.category === "all" || entry.category === filterState.category) &&
      (filterState.tone === "all" || entry.tone === filterState.tone) &&
      (!filterState.query || queryTarget.includes(filterState.query.toLowerCase()))
    );
  }

  function renderExplorer() {
    const filtered = entries.filter(matchesFilter);
    const selected =
      filtered.find((entry) => entry.id === filterState.selectedId) ?? filtered[0] ?? null;
    const visible = selected
      ? [
          selected,
          ...filtered
            .filter((entry) => entry.id !== selected.id)
            .slice(0, maxVisibleResults - 1)
        ]
      : filtered.slice(0, maxVisibleResults);

    if (selected) {
      filterState.selectedId = selected.id;
    }

    resultsHost.innerHTML =
      filtered.length === 0
        ? '<div class="result-card"><h3>No matches</h3><p>Change the filter mix and try again.</p></div>'
        : visible
            .map(
              (entry) => `
                <article class="result-card ${entry.id === filterState.selectedId ? "is-selected" : ""}" data-entry-id="${escapeHtml(entry.id)}">
                  <div class="sample-header">
                    <div>
                      <div class="eyebrow">${escapeHtml(entry.categoryTitle)}</div>
                      <h3>${escapeHtml(entry.title)}</h3>
                  </div>
                    <span class="pill">${escapeHtml(entry.tone)}</span>
                  </div>
                  <p>${escapeHtml(entry.summary)}</p>
                </article>
              `
            )
            .join("");

    resultCount.textContent =
      filtered.length > maxVisibleResults
        ? `Showing ${visible.length} of ${filtered.length} entries`
        : `${filtered.length} entries`;
    detailHost.innerHTML = selected
      ? `
        ${renderEntryDetail(selected)}
        <div class="sample-header">
          <h3>Response Payload</h3>
          <button class="button button-quiet" type="button" data-copy-target="entry-json">Copy JSON</button>
        </div>
        <pre class="code-block" id="entry-json">${escapeHtml(formatJson(selected))}</pre>
        <div class="sample-header">
          <h3>Fetch Example</h3>
          <button class="button button-quiet" type="button" data-copy-target="entry-fetch">Copy Fetch</button>
        </div>
        <pre class="code-block" id="entry-fetch">${escapeHtml(getFetchSnippet(selected))}</pre>
      `
      : '<div class="entry-header"><h3>No entry selected</h3></div><p>Choose an entry from the list.</p>';

    syncUrl();
  }

  categorySelect.addEventListener("change", () => {
    filterState.category = categorySelect.value;
    renderExplorer();
  });

  toneSelect.addEventListener("change", () => {
    filterState.tone = toneSelect.value;
    renderExplorer();
  });

  searchInput.addEventListener("input", () => {
    filterState.query = searchInput.value.trim();
    renderExplorer();
  });

  resultsHost.addEventListener("click", (event) => {
    const card = event.target.closest("[data-entry-id]");

    if (!card) {
      return;
    }

    filterState.selectedId = card.getAttribute("data-entry-id") || "";
    renderExplorer();
  });

  byId("random-entry-button").addEventListener("click", () => {
    const filtered = entries.filter(matchesFilter);

    if (filtered.length === 0) {
      return;
    }

    filterState.selectedId = pickRandom(filtered).id;
    renderExplorer();
  });

  renderExplorer();
}

function buildStatusTimeline(length, incidents) {
  return Array.from({ length }, (_, index) => {
    let level = 0;

    for (const incident of incidents) {
      if (index >= incident.start && index < incident.start + incident.length) {
        level = Math.max(level, incident.level);
      }
    }

    return level;
  });
}

function renderStatusBars(timeline) {
  return timeline
    .map(
      (level, index) => `
        <span
          class="status-bar"
          data-level="${level}"
          style="--i:${index};"
          aria-hidden="true"
        ></span>
      `
    )
    .join("");
}

async function renderStatusPage() {
  const updated = byId("status-updated");

  if (updated) {
    updated.textContent = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date());
  }

  const snapshotHost = byId("status-snapshot-grid");
  const productHost = byId("status-product-grid");
  const componentHost = byId("status-component-table");
  const incidentHost = byId("status-incident-list");

  if (!snapshotHost || !productHost || !componentHost || !incidentHost) {
    return;
  }

  const snapshots = [
    {
      label: "Collections API",
      value: "99.99%",
      note: "Static delivery path remains cleaner than the architectures it documents."
    },
    {
      label: "Truthfulness latency",
      value: "4m 12s",
      note: "Stakeholders continue to ask for softer wording before accepting direct answers."
    },
    {
      label: "Blame routing",
      value: "Degraded",
      note: "Ownership is known in theory and politely renegotiated in practice."
    }
  ];

  const services = [
    {
      name: "Collections API",
      status: "Operational",
      statusTone: "accent-green",
      uptime: "99.99%",
      components: 20,
      copy: "Published JSON collections continue to resolve cleanly under the v1 namespace.",
      timeline: buildStatusTimeline(45, [{ start: 17, length: 1, level: 1 }])
    },
    {
      name: "Docs experience",
      status: "Operational",
      statusTone: "accent-green",
      uptime: "99.96%",
      components: 8,
      copy: "Reference pages are rendering correctly after the right-rail intervention.",
      timeline: buildStatusTimeline(45, [{ start: 9, length: 1, level: 1 }, { start: 30, length: 1, level: 1 }])
    },
    {
      name: "Explorer queries",
      status: "Elevated",
      statusTone: "accent-gold",
      uptime: "99.93%",
      components: 3,
      copy: "Search remains quick, but the interface has stopped pretending every tag deserves top billing.",
      timeline: buildStatusTimeline(45, [{ start: 11, length: 2, level: 1 }, { start: 27, length: 1, level: 1 }])
    },
    {
      name: "Blame routing",
      status: "Degraded",
      statusTone: "accent-red",
      uptime: "97.40%",
      components: 4,
      copy: "Escalation still reaches the correct team after a brief tour through organizational ambiguity.",
      timeline: buildStatusTimeline(45, [{ start: 6, length: 2, level: 2 }, { start: 21, length: 3, level: 1 }, { start: 36, length: 2, level: 2 }])
    }
  ];

  const components = [
    ["API index", "Operational", "Version catalog and collection manifests are serving nominally."],
    ["Random endpoint", "Operational", "Build-time sample generation is stable under /api/v1/random."],
    ["Architecture collection", "Operational", "Still identifying decorative scale with unreasonable confidence."],
    ["Incident collection", "Operational", "Still translating outages into socially survivable prose."],
    ["Agent collection", "Elevated scrutiny", "Synthetic staff continue to require supervision near production."],
    ["Status renderer", "Operational", "Historical bars remain more composed than the humans reading them."]
  ];

  const incidents = [
    {
      title: "Resolved: random sample briefly became suspiciously useful",
      time: "Apr 17, 2026 at 7:49 PM",
      tone: "is-good",
      body: "The endpoint returned a deeply relevant entry before anyone had prepared the surrounding narrative."
    },
    {
      title: "Monitoring: truthfulness latency elevated during stakeholder review",
      time: "Apr 17, 2026 at 6:12 PM",
      tone: "is-warn",
      body: "Direct answers were technically available, but additional phrasing layers were requested before distribution."
    },
    {
      title: "Resolved: blame routing experienced brief ownership drift",
      time: "Apr 16, 2026 at 11:08 PM",
      tone: "is-red",
      body: "The responsible team was known, then reviewed, then confirmed again with improved confidence."
    }
  ];

  snapshotHost.innerHTML = snapshots
    .map(
      (snapshot) => `
        <article class="status-snapshot">
          <div class="status-snapshot-label">${escapeHtml(snapshot.label)}</div>
          <div class="status-snapshot-value">${escapeHtml(snapshot.value)}</div>
          <p class="status-snapshot-note">${escapeHtml(snapshot.note)}</p>
        </article>
      `
    )
    .join("");

  productHost.innerHTML = services
    .map(
      (service) => `
        <article class="status-service-card">
          <div class="status-service-head">
            <div>
              <h3 class="status-service-name">${escapeHtml(service.name)}</h3>
              <p class="status-service-copy">${escapeHtml(service.copy)}</p>
            </div>
            <span class="status-pill ${escapeHtml(service.statusTone)}">${escapeHtml(service.status)}</span>
          </div>
          <div class="status-service-metrics">
            <span><strong>${escapeHtml(service.uptime)}</strong> uptime</span>
            <span>${service.components} components</span>
          </div>
          <div class="status-service-bars" aria-label="${escapeHtml(service.name)} availability history">
            ${renderStatusBars(service.timeline)}
          </div>
          <div class="status-service-scale">
            <span>45 days ago</span>
            <span>Today</span>
          </div>
        </article>
      `
    )
    .join("");

  componentHost.innerHTML = components
    .map(
      ([name, status, note]) => `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(status)}</td>
          <td>${escapeHtml(note)}</td>
        </tr>
      `
    )
    .join("");

  incidentHost.innerHTML = incidents
    .map(
      (incident) => `
        <article class="status-incident">
          <span class="status-incident-dot ${escapeHtml(incident.tone)}"></span>
          <div class="status-incident-time">${escapeHtml(incident.time)}</div>
          <h3>${escapeHtml(incident.title)}</h3>
          <p>${escapeHtml(incident.body)}</p>
        </article>
      `
    )
    .join("");
}

async function init() {
  installCopyButtons();

  try {
    await applyGlobalStats();
  } catch (error) {
    console.error(error);
  }

  const page = document.body.dataset.page;

  try {
    if (page === "home") {
      await renderHomePage();
    }

    if (page === "docs") {
      await renderDocsPage();
    }

    if (page === "categories") {
      await renderCategoriesPage();
    }

    if (page === "status") {
      await renderStatusPage();
    }
  } catch (error) {
    console.error(error);
    const pageError = byId("page-error");

    if (pageError) {
      pageError.classList.remove("hidden");
      pageError.textContent =
        "The static API data did not load cleanly. Rebuild the repo and refresh the page.";
    }
  }
}

void init();

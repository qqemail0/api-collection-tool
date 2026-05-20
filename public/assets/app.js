const state = {
  data: null,
  query: "",
  category: "",
  filters: {
    auth: "all",
    https: "all",
    cors: "all"
  },
  selectedId: ""
};

const els = {
  sourceLabel: document.querySelector("#sourceLabel"),
  generatedAt: document.querySelector("#generatedAt"),
  apiTotal: document.querySelector("#apiTotal"),
  categoryTotal: document.querySelector("#categoryTotal"),
  noAuthTotal: document.querySelector("#noAuthTotal"),
  browserReadyTotal: document.querySelector("#browserReadyTotal"),
  searchInput: document.querySelector("#searchInput"),
  filterButtons: [...document.querySelectorAll(".chip")],
  categoryList: document.querySelector("#categoryList"),
  clearCategory: document.querySelector("#clearCategory"),
  resultCount: document.querySelector("#resultCount"),
  apiList: document.querySelector("#apiList"),
  apiDetail: document.querySelector("#apiDetail"),
  categoryTemplate: document.querySelector("#categoryTemplate"),
  apiTemplate: document.querySelector("#apiTemplate")
};

function formatDate(value) {
  if (!value) return "未知";
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function badgeClass(label, value) {
  if (label === "HTTPS" || label === "CORS") {
    if (value === "Yes") return "good";
    if (value === "No") return "bad";
    return "warn";
  }
  if (label === "Auth") {
    if (value === "No") return "good";
    if (value === "Unknown") return "warn";
    return "warn";
  }
  return "";
}

function badge(label, value) {
  const span = document.createElement("span");
  span.className = `badge ${badgeClass(label, value)}`.trim();
  span.textContent = `${label}: ${value}`;
  return span;
}

function searchable(api) {
  return [
    api.name,
    api.description,
    api.category,
    api.categoryZh,
    api.auth,
    api.https,
    api.cors,
    api.purpose,
    ...(api.tags || [])
  ].join(" ").toLowerCase();
}

function filteredApis() {
  if (!state.data) return [];
  const q = state.query.trim().toLowerCase();

  return state.data.apis.filter((api) => {
    if (state.category && api.category !== state.category) return false;
    if (state.filters.auth !== "all" && api.auth !== state.filters.auth) return false;
    if (state.filters.https !== "all" && api.https !== state.filters.https) return false;
    if (state.filters.cors !== "all" && api.cors !== state.filters.cors) return false;
    if (q && !searchable(api).includes(q)) return false;
    return true;
  });
}

function renderStats() {
  const totals = state.data.totals;
  els.apiTotal.textContent = totals.apis.toLocaleString("zh-CN");
  els.categoryTotal.textContent = totals.categories.toLocaleString("zh-CN");
  els.noAuthTotal.textContent = totals.noAuth.toLocaleString("zh-CN");
  els.browserReadyTotal.textContent = totals.browserReady.toLocaleString("zh-CN");
  els.sourceLabel.textContent = state.data.source.type === "local-readme" ? "本地 public-apis" : "官方 public-apis";
  els.generatedAt.textContent = `生成：${formatDate(state.data.generatedAt)}`;
}

function renderCategories() {
  els.categoryList.innerHTML = "";

  for (const category of state.data.categories) {
    const node = els.categoryTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle("active", category.name === state.category);
    node.querySelector(".category-name").textContent = `${category.zh} / ${category.name}`;
    node.querySelector(".category-desc").textContent = category.description;
    node.querySelector(".category-count").textContent = category.count;
    node.addEventListener("click", () => {
      state.category = category.name;
      render();
    });
    els.categoryList.append(node);
  }
}

function renderList() {
  const apis = filteredApis();
  els.resultCount.textContent = `${apis.length.toLocaleString("zh-CN")} 个结果`;
  els.apiList.innerHTML = "";

  if (!apis.length) {
    const empty = document.createElement("div");
    empty.className = "empty-detail";
    empty.innerHTML = "<h2>没有匹配结果</h2><p>换一个关键词，或清除分类和筛选条件。</p>";
    els.apiList.append(empty);
    renderDetail(null);
    return;
  }

  if (!apis.some((api) => api.id === state.selectedId)) {
    state.selectedId = apis[0].id;
  }

  for (const api of apis.slice(0, 220)) {
    const node = els.apiTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle("active", api.id === state.selectedId);
    node.querySelector(".api-name").textContent = api.name;
    node.querySelector(".api-category").textContent = api.categoryZh;
    node.querySelector(".api-description").textContent = api.description;
    const badges = node.querySelector(".api-badges");
    badges.append(badge("Auth", api.auth), badge("HTTPS", api.https), badge("CORS", api.cors));
    node.addEventListener("click", () => {
      state.selectedId = api.id;
      location.hash = `api=${api.id}`;
      render();
    });
    els.apiList.append(node);
  }

  if (apis.length > 220) {
    const more = document.createElement("div");
    more.className = "muted";
    more.textContent = `结果较多，已显示前 220 个。继续输入关键词可以缩小范围。`;
    els.apiList.append(more);
  }

  renderDetail(state.data.apis.find((api) => api.id === state.selectedId) || apis[0]);
}

function list(items, ordered = false) {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDetail(api) {
  if (!api) {
    els.apiDetail.innerHTML = "<div class=\"empty-detail\"><h2>没有可展示的 API</h2><p>请调整筛选条件。</p></div>";
    return;
  }

  els.apiDetail.innerHTML = `
    <div class="detail-title">
      <p class="kicker">${escapeHtml(api.categoryZh)} / ${escapeHtml(api.category)}</p>
      <h2>${escapeHtml(api.name)}</h2>
      <p class="detail-meta">${escapeHtml(api.description)}</p>
      <div class="badge-row" id="detailBadges"></div>
      <div class="detail-actions">
        <a class="action-link" href="${escapeHtml(api.url)}" target="_blank" rel="noreferrer">打开文档</a>
        <button class="copy-button" type="button" id="copySample">复制请求示例</button>
      </div>
    </div>

    <section class="detail-section">
      <h3>用途</h3>
      <p>${escapeHtml(api.purpose)}</p>
    </section>

    <section class="detail-section">
      <h3>使用方法</h3>
      ${list(api.usage, true)}
    </section>

    <section class="detail-section">
      <h3>请求示例</h3>
      <pre><code>${escapeHtml(api.sampleRequest)}</code></pre>
    </section>

    <section class="detail-section">
      <h3>适合场景</h3>
      ${list(api.useCases)}
    </section>

    <section class="detail-section">
      <h3>接入注意事项</h3>
      ${list(api.notes)}
    </section>
  `;

  const badges = document.querySelector("#detailBadges");
  badges.append(badge("Auth", api.auth), badge("HTTPS", api.https), badge("CORS", api.cors));
  document.querySelector("#copySample").addEventListener("click", async () => {
    await navigator.clipboard.writeText(api.sampleRequest);
    document.querySelector("#copySample").textContent = "已复制";
    setTimeout(() => {
      const button = document.querySelector("#copySample");
      if (button) button.textContent = "复制请求示例";
    }, 1200);
  });
}

function renderFilters() {
  for (const button of els.filterButtons) {
    const filter = button.dataset.filter;
    const value = button.dataset.value;
    const active = filter === "auth" && value === "all"
      ? state.filters.auth === "all" && state.filters.https === "all" && state.filters.cors === "all"
      : state.filters[filter] === value;
    button.classList.toggle("active", active);
  }
}

function render() {
  renderStats();
  renderCategories();
  renderFilters();
  renderList();
}

function readHashSelection() {
  const value = decodeURIComponent(location.hash.replace(/^#api=/, ""));
  if (value) state.selectedId = value;
}

async function init() {
  const response = await fetch("data/apis.json", { cache: "no-store" });
  state.data = await response.json();
  readHashSelection();
  render();
}

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

els.clearCategory.addEventListener("click", () => {
  state.category = "";
  render();
});

for (const button of els.filterButtons) {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    const value = button.dataset.value;
    if (filter === "auth" && value === "all") {
      state.filters = { auth: "all", https: "all", cors: "all" };
    } else {
      state.filters[filter] = state.filters[filter] === value ? "all" : value;
    }
    render();
  });
}

window.addEventListener("hashchange", () => {
  readHashSelection();
  render();
});

init().catch((error) => {
  els.apiDetail.innerHTML = `<div class="empty-detail"><h2>数据加载失败</h2><p>${escapeHtml(error.message)}</p></div>`;
});

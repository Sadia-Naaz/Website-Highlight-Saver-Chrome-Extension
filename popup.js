const MARK_COLORS = ["#f4e04d", "#6fe3b4", "#ff8fa3", "#7ec8f2"];

const listEl = document.getElementById("highlightList");
const emptyEl = document.getElementById("emptyState");
const countEl = document.getElementById("countLabel");
const cardTemplate = document.getElementById("cardTemplate");

const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const keyStatus = document.getElementById("keyStatus");

init();

function init() {
  loadHighlights();
  loadApiKey();

  settingsToggle.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden");
  });

  saveKeyBtn.addEventListener("click", saveApiKey);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.highlights) {
      renderHighlights(changes.highlights.newValue || []);
    }
  });
}

function loadApiKey() {
  chrome.storage.local.get({ openaiApiKey: "" }, (data) => {
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
    }
  });
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  chrome.storage.local.set({ openaiApiKey: key }, () => {
    keyStatus.textContent = key ? "Saved on this device." : "Key cleared.";
    keyStatus.classList.toggle("ok", !!key);
    setTimeout(() => (keyStatus.textContent = ""), 2200);
  });
}

function loadHighlights() {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    renderHighlights(data.highlights || []);
  });
}

function renderHighlights(highlights) {
  listEl.innerHTML = "";
  countEl.textContent = `${highlights.length} saved`;

  if (!highlights.length) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  highlights.forEach((h, i) => {
    const node = cardTemplate.content.firstElementChild.cloneNode(true);
    const color = MARK_COLORS[i % MARK_COLORS.length];
    node.style.setProperty("--mark-color", color);

    node.querySelector(".mark").textContent = h.text;
    node.querySelector(".card-source").textContent = safeHostname(h.url) || h.title || "Unknown source";
    node.querySelector(".card-source").title = h.url || "";
    node.querySelector(".card-time").textContent = relativeTime(h.timestamp);

    const summaryEl = node.querySelector(".card-summary");
    const summarizeBtn = node.querySelector(".summarize-btn");
    const deleteBtn = node.querySelector(".delete-btn");

    summarizeBtn.addEventListener("click", () =>
      handleSummarize(h, summaryEl, summarizeBtn)
    );
    deleteBtn.addEventListener("click", () => deleteHighlight(h.id));

    listEl.appendChild(node);
  });
}

function deleteHighlight(id) {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    const remaining = (data.highlights || []).filter((h) => h.id !== id);
    chrome.storage.local.set({ highlights: remaining });
  });
}

async function handleSummarize(highlight, summaryEl, btn) {
  chrome.storage.local.get({ openaiApiKey: "" }, async (data) => {
    const apiKey = data.openaiApiKey;

    if (!apiKey) {
      summaryEl.textContent =
        "Add an OpenAI API key in Settings (gear icon) to enable summaries.";
      summaryEl.classList.remove("hidden");
      settingsPanel.classList.remove("hidden");
      apiKeyInput.focus();
      return;
    }

    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = "Summarizing…";
    summaryEl.classList.remove("hidden");
    summaryEl.textContent = "Thinking…";

    try {
      const summary = await requestSummary(highlight.text, apiKey);
      summaryEl.textContent = summary;
    } catch (err) {
      summaryEl.textContent = `Couldn't summarize: ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
}

async function requestSummary(text, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize short highlighted passages in one or two plain sentences. Be concise and neutral."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 120
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const summary = data?.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error("Empty response from model.");
  return summary;
}

function safeHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function relativeTime(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

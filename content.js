// Highlight Saver — content script
// Watches for text selections on the page and offers to save them.

(function () {
  const BUTTON_CLASS = "hls-save-btn";
  const TOAST_CLASS = "hls-toast";

  let btnEl = null;
  let toastEl = null;
  let toastTimer = null;

  document.addEventListener("mouseup", onMouseUp, true);
  document.addEventListener("mousedown", onMouseDown, true);
  window.addEventListener("scroll", removeButton, true);
  window.addEventListener("resize", removeButton, true);

  function onMouseDown(e) {
    if (btnEl && !btnEl.contains(e.target)) removeButton();
  }

  function onMouseUp(e) {
    if (btnEl && btnEl.contains(e.target)) return; // let click handler fire
    // Defer so the browser finishes updating window.getSelection()
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";

      if (!text || selection.rangeCount === 0) {
        removeButton();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        removeButton();
        return;
      }

      showButton(rect, text);
    }, 0);
  }

  function showButton(rect, text) {
    removeButton();

    btnEl = document.createElement("div");
    btnEl.className = BUTTON_CLASS;
    btnEl.setAttribute("role", "button");
    btnEl.tabIndex = 0;
    btnEl.innerHTML =
      '<span class="hls-dot"></span><span>Save Highlight?</span>';

    const top = window.scrollY + rect.bottom + 8;
    const left = Math.max(8, window.scrollX + rect.left);
    btnEl.style.top = `${top}px`;
    btnEl.style.left = `${left}px`;

    btnEl.addEventListener("mousedown", (e) => {
      // prevent the page from clearing the selection before we save it
      e.preventDefault();
      e.stopPropagation();
    });

    btnEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveHighlight(text);
      showToast("Highlight saved");
      removeButton();
    });

    document.documentElement.appendChild(btnEl);
  }

  function removeButton() {
    if (btnEl) {
      btnEl.remove();
      btnEl = null;
    }
  }

  function showToast(message) {
    if (toastEl) toastEl.remove();
    if (toastTimer) clearTimeout(toastTimer);

    toastEl = document.createElement("div");
    toastEl.className = TOAST_CLASS;
    toastEl.textContent = message;
    document.documentElement.appendChild(toastEl);

    // trigger CSS transition
    requestAnimationFrame(() => toastEl.classList.add("hls-toast-visible"));

    toastTimer = setTimeout(() => {
      if (toastEl) {
        toastEl.classList.remove("hls-toast-visible");
        setTimeout(() => toastEl && toastEl.remove(), 200);
      }
    }, 1600);
  }

  function saveHighlight(text) {
    const highlight = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      url: location.href,
      title: document.title || location.hostname,
      timestamp: Date.now()
    };

    chrome.storage.local.get({ highlights: [] }, (data) => {
      const highlights = Array.isArray(data.highlights) ? data.highlights : [];
      highlights.unshift(highlight);
      chrome.storage.local.set({ highlights });
    });
  }
})();

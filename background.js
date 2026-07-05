chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    if (!Array.isArray(data.highlights)) {
      chrome.storage.local.set({ highlights: [] });
    }
  });
});

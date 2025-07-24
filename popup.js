const DEFAULT_INSTANCE = "https://inv.nadeko.net";
const input = document.getElementById("instanceInput");
const status = document.getElementById("status");
const button = document.getElementById("switchBtn");

button.addEventListener("click", async () => {
  const instance = input.value.trim().replace(/\/+$/, "") || DEFAULT_INSTANCE;
  status.textContent = "Detecting video…";

  // Save instance
  chrome.storage.sync.set({ invidiousInstance: instance });

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      status.textContent = "Couldn't read the current tab URL.";
      return;
    }

    const videoId = extractYouTubeId(tab.url);
    if (!videoId) {
      status.textContent = "No YouTube video ID found on this page.";
      return;
    }

    const target = `${instance}/watch?v=${videoId}`;
    await chrome.tabs.update(tab.id, { url: target });
    window.close();
  } catch (e) {
    console.error(e);
    status.textContent = "Something went wrong.";
  }
});

// On popup open: load stored instance or fallback to default
chrome.storage.sync.get(["invidiousInstance"], (data) => {
  input.value = data.invidiousInstance || DEFAULT_INSTANCE;
});

function extractYouTubeId(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if ((host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) && url.pathname === "/watch")
      return url.searchParams.get("v");

    if (host.endsWith("youtube.com") && url.pathname.startsWith("/shorts/"))
      return url.pathname.split("/")[2] || null;

    if (host.endsWith("youtube.com") && url.pathname.startsWith("/embed/"))
      return url.pathname.split("/")[2] || null;

    if (host === "youtu.be")
      return url.pathname.split("/")[1] || null;

    const vParam = url.searchParams.get("v");
    if (vParam) return vParam;

    return null;
  } catch {
    return null;
  }
}

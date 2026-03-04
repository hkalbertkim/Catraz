const RISK_ENGINE_API = "https://risk-engine.catraz.local/v1/evaluate";
const REQUEST_TIMEOUT_MS = 3500;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "RISK_EVALUATE") {
    return false;
  }

  evaluateRisk(message.payload)
    .then((assessment) => {
      const enriched = {
        timestamp: new Date().toISOString(),
        ...assessment,
        request: message.payload
      };
      chrome.storage.local.set({ catrazLastAssessment: enriched });
      sendResponse({ ok: true, assessment: enriched });
    })
    .catch((error) => {
      const fallback = {
        action: "WARN",
        score: 80,
        reason: `Risk engine unavailable: ${error.message}`,
        source: "fallback",
        timestamp: new Date().toISOString(),
        request: message.payload
      };
      chrome.storage.local.set({ catrazLastAssessment: fallback });
      sendResponse({ ok: true, assessment: fallback });
    });

  return true;
});

async function evaluateRisk(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(RISK_ENGINE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return normalizeAssessment(data);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAssessment(data) {
  const action = String(data?.action || "WARN").toUpperCase();
  const allowedActions = new Set(["ALLOW", "WARN", "BLOCK", "DELAY"]);

  return {
    action: allowedActions.has(action) ? action : "WARN",
    score: Number.isFinite(Number(data?.score)) ? Number(data.score) : null,
    reason: data?.reason || "No reason provided",
    source: "risk-engine"
  };
}

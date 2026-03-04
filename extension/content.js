const CATRAZ_REQ_EVENT = "CATRAZ_INTERCEPT_REQUEST";
const CATRAZ_RES_EVENT = "CATRAZ_INTERCEPT_DECISION";
const CATRAZ_UI_PREFIX = "catraz-ui";

injectProviderInterceptors();
bindInpageMessages();

function injectProviderInterceptors() {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.textContent = `(() => {
    const REQ_EVENT = "${CATRAZ_REQ_EVENT}";
    const RES_EVENT = "${CATRAZ_RES_EVENT}";
    const TIMEOUT_MS = 5000;
    let requestCounter = 0;

    function nextId() {
      requestCounter += 1;
      return "catraz-" + Date.now() + "-" + requestCounter;
    }

    function requestDecision(payload) {
      const id = nextId();
      return new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          window.removeEventListener("message", onMessage);
          resolve({ action: "WARN", reason: "Guardian timeout", score: null });
        }, TIMEOUT_MS);

        function onMessage(event) {
          if (event.source !== window) return;
          const msg = event.data;
          if (!msg || msg.type !== RES_EVENT || msg.id !== id) return;
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          window.removeEventListener("message", onMessage);
          resolve(msg.decision || { action: "WARN", reason: "Empty decision" });
        }

        window.addEventListener("message", onMessage);
        window.postMessage({ type: REQ_EVENT, id, payload }, "*");
      });
    }

    function shouldInspectEthereum(method) {
      return method === "eth_sendTransaction";
    }

    function shouldInspectSolana(method) {
      return ["sendTransaction", "signAndSendTransaction"].includes(method);
    }

    function wrapProviderRequest(providerType, provider, fnName) {
      if (!provider || typeof provider[fnName] !== "function") return;
      if (provider[fnName].__catrazWrapped) return;

      const original = provider[fnName].bind(provider);

      const wrapped = async function (...args) {
        let method = "unknown";
        let params = [];

        if (providerType === "ethereum") {
          const req = args[0] || {};
          method = req.method || "unknown";
          params = Array.isArray(req.params) ? req.params : [];
        } else if (providerType === "solana") {
          if (fnName === "request") {
            const req = args[0] || {};
            method = req.method || "request";
            params = Array.isArray(req.params) ? req.params : [];
          } else {
            method = fnName;
            params = args;
          }
        }

        const inspect = providerType === "ethereum"
          ? shouldInspectEthereum(method)
          : shouldInspectSolana(method);

        if (!inspect) {
          return original(...args);
        }

        const decision = await requestDecision({
          provider: providerType,
          method,
          params,
          origin: window.location.origin,
          href: window.location.href
        });

        const action = String((decision && decision.action) || "WARN").toUpperCase();
        if (action === "BLOCK") {
          throw new Error("[Catraz Guardian] Transaction blocked: " + (decision.reason || "high risk"));
        }

        return original(...args);
      };

      wrapped.__catrazWrapped = true;
      provider[fnName] = wrapped;
    }

    function wrapEthereum() {
      const eth = window.ethereum;
      if (!eth) return;
      wrapProviderRequest("ethereum", eth, "request");
      wrapProviderRequest("ethereum", eth, "send");
      wrapProviderRequest("ethereum", eth, "sendAsync");
    }

    function wrapSolana() {
      const sol = window.solana;
      if (!sol) return;
      wrapProviderRequest("solana", sol, "request");
      wrapProviderRequest("solana", sol, "sendTransaction");
      wrapProviderRequest("solana", sol, "signAndSendTransaction");
    }

    function tryWrap() {
      wrapEthereum();
      wrapSolana();
    }

    tryWrap();

    const interval = setInterval(tryWrap, 1000);
    window.addEventListener("beforeunload", () => clearInterval(interval));
  })();`;

  document.documentElement.appendChild(script);
  script.remove();
}

function bindInpageMessages() {
  window.addEventListener("message", async (event) => {
    if (event.source !== window) {
      return;
    }

    const msg = event.data;
    if (!msg || msg.type !== CATRAZ_REQ_EVENT) {
      return;
    }

    const payload = msg.payload || {};
    if (payload.method === "eth_sendTransaction") {
      renderTxPreview(payload);
    }

    let assessment;
    try {
      assessment = await queryRiskEngine(payload);
    } catch (error) {
      assessment = {
        action: "WARN",
        reason: `Risk check failed: ${error.message || "unknown error"}`,
        score: null
      };
    }

    if (assessment.action === "WARN" || assessment.action === "BLOCK" || assessment.action === "DELAY") {
      renderRiskAlert(assessment, payload);
    }

    window.postMessage(
      {
        type: CATRAZ_RES_EVENT,
        id: msg.id,
        decision: assessment
      },
      "*"
    );
  });
}

function queryRiskEngine(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "RISK_EVALUATE", payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response || !response.ok || !response.assessment) {
        reject(new Error("Invalid risk response"));
        return;
      }

      resolve(response.assessment);
    });
  });
}

function renderTxPreview(payload) {
  const tx = Array.isArray(payload.params) ? payload.params[0] || {} : {};
  const lines = [
    `Method: ${payload.method}`,
    `To: ${tx.to || "(contract creation / unknown)"}`,
    `Value: ${tx.value || "0"}`,
    `Data: ${truncate(tx.data || "none", 66)}`
  ];

  showPanel({
    id: `${CATRAZ_UI_PREFIX}-preview`,
    title: "Catraz: Transaction Preview",
    body: lines.join("\n"),
    variant: "preview"
  });
}

function renderRiskAlert(assessment, payload) {
  const action = String(assessment.action || "WARN").toUpperCase();
  const lines = [
    `Provider: ${payload.provider || "unknown"}`,
    `Method: ${payload.method || "unknown"}`,
    `Action: ${action}`,
    `Reason: ${assessment.reason || "No reason"}`,
    `Score: ${assessment.score ?? "n/a"}`
  ];

  showPanel({
    id: `${CATRAZ_UI_PREFIX}-risk`,
    title: `Catraz Risk ${action}`,
    body: lines.join("\n"),
    variant: action === "BLOCK" ? "block" : "warn"
  });
}

function showPanel({ id, title, body, variant }) {
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement("div");
  panel.id = id;
  panel.style.position = "fixed";
  panel.style.right = "16px";
  panel.style.bottom = id.endsWith("preview") ? "136px" : "16px";
  panel.style.zIndex = "2147483647";
  panel.style.maxWidth = "360px";
  panel.style.whiteSpace = "pre-line";
  panel.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
  panel.style.fontSize = "12px";
  panel.style.lineHeight = "1.35";
  panel.style.borderRadius = "10px";
  panel.style.border = "1px solid #334155";
  panel.style.padding = "10px";
  panel.style.boxShadow = "0 10px 25px rgba(2, 6, 23, 0.45)";

  if (variant === "block") {
    panel.style.background = "#3a1218";
    panel.style.color = "#fecdd3";
  } else if (variant === "warn") {
    panel.style.background = "#3a2a0f";
    panel.style.color = "#fde68a";
  } else {
    panel.style.background = "#0f172a";
    panel.style.color = "#cbd5e1";
  }

  panel.innerHTML = `<strong>${escapeHtml(title)}</strong><br>${escapeHtml(body)}`;
  document.documentElement.appendChild(panel);

  setTimeout(() => panel.remove(), variant === "preview" ? 9000 : 12000);
}

function truncate(v, max) {
  if (!v || v.length <= max) return v;
  return `${v.slice(0, max)}...`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

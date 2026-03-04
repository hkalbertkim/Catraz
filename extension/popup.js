const actionEl = document.getElementById("action");
const reasonEl = document.getElementById("reason");
const methodEl = document.getElementById("method");
const timeEl = document.getElementById("time");

chrome.storage.local.get("catrazLastAssessment", ({ catrazLastAssessment }) => {
  if (!catrazLastAssessment) {
    return;
  }

  const action = String(catrazLastAssessment.action || "WARN").toUpperCase();
  actionEl.textContent = action;
  actionEl.className = `badge ${action}`;

  reasonEl.textContent = catrazLastAssessment.reason || "No reason provided";

  const provider = catrazLastAssessment.request?.provider || "unknown";
  const method = catrazLastAssessment.request?.method || "unknown";
  methodEl.textContent = `Provider: ${provider} | Method: ${method}`;

  const ts = catrazLastAssessment.timestamp ? new Date(catrazLastAssessment.timestamp) : null;
  timeEl.textContent = ts ? `Last assessment: ${ts.toLocaleString()}` : "";
});

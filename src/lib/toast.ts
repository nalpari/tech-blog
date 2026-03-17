"use client";

export function showToast(message: string, duration = 2500) {
  const existing = document.getElementById("global-toast");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.id = "global-toast";
  el.textContent = message;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "2.5rem",
    left: "50%",
    transform: "translateX(-50%) translateY(8px)",
    padding: "0.875rem 2rem",
    fontSize: "0.875rem",
    fontFamily: "var(--font-mono), monospace",
    color: "#818cf8",
    background: "rgba(17, 17, 19, 0.95)",
    border: "1px solid rgba(129, 140, 248, 0.3)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(129, 140, 248, 0.1)",
    backdropFilter: "blur(12px)",
    zIndex: "9999",
    opacity: "0",
    transition: "opacity 0.3s, transform 0.3s",
    letterSpacing: "0.02em",
  });

  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(0)";
  });

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(8px)";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

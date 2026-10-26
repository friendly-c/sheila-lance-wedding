import { weddingConfig } from "./site-config.js";

const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
    menuToggle.setAttribute("aria-label", !isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      siteNav.classList.remove("is-open");
    });
  });
}

// Use one config source for the shared footer and pages with live date details.
document.querySelectorAll("[data-wedding-date]").forEach((node) => {
  node.textContent = weddingConfig.dateLabel;
});
document.querySelectorAll("[data-couple-name]").forEach((node) => {
  node.textContent = weddingConfig.couple;
});
document.querySelectorAll("[data-wedding-venue]").forEach((node) => {
  node.textContent = weddingConfig.venue;
});
document.querySelectorAll("[data-wedding-location]").forEach((node) => {
  node.textContent = weddingConfig.location;
});
document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const countdown = document.querySelector("[data-countdown]");
if (countdown) {
  const target = new Date(weddingConfig.dateISO).getTime();
  const fields = {
    days: countdown.querySelector('[data-time="days"]'),
    hours: countdown.querySelector('[data-time="hours"]'),
    minutes: countdown.querySelector('[data-time="minutes"]'),
    seconds: countdown.querySelector('[data-time="seconds"]'),
  };
  const finish = countdown.querySelector("[data-countdown-finish]");

  const updateCountdown = () => {
    const remaining = target - Date.now();
    if (remaining <= 0) {
      Object.values(fields).forEach((field) => { if (field) field.textContent = "00"; });
      if (finish) finish.hidden = false;
      return;
    }
    const values = {
      days: Math.floor(remaining / 86_400_000),
      hours: Math.floor((remaining % 86_400_000) / 3_600_000),
      minutes: Math.floor((remaining % 3_600_000) / 60_000),
      seconds: Math.floor((remaining % 60_000) / 1_000),
    };
    Object.entries(values).forEach(([key, value]) => {
      if (fields[key]) fields[key].textContent = String(value).padStart(2, "0");
    });
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
}

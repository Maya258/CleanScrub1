function openWhatsApp() {
  const phone = "27670626007";
  const message = "Hi Clean Scrub, I would like to book a car wash.";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

window.addEventListener("load", () => {
  const btn = document.querySelector(".whatsapp-btn");
  btn.style.opacity = "0";
  btn.style.transform = "scale(0.5)";

  setTimeout(() => {
    btn.style.transition = "all 0.5s ease";
    btn.style.opacity = "1";
    btn.style.transform = "scale(1)";
  }, 300);
});

/* =========================
   WHATSAPP BOOKING
   ========================= */
function openWhatsApp() {
  const phone = "27670626007";
  const message = "Hi Clean Scrub, I would like to book a cleaning service.";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

/* =========================
   WHATSAPP BUTTON ANIMATION
   ========================= */
window.addEventListener("load", () => {
  const btn = document.querySelector(".whatsapp-float");
  if (!btn) return;

  btn.style.opacity = "0";
  btn.style.transform = "scale(0.5)";

  setTimeout(() => {
    btn.style.transition = "all 0.5s ease";
    btn.style.opacity = "1";
    btn.style.transform = "scale(1)";
  }, 300);
});

/* =========================
   ABOUT SECTION REVEAL
   ========================= */
const aboutContent = document.querySelector(".about-content");

function revealAbout() {
  if (!aboutContent) return;

  const windowHeight = window.innerHeight;
  const revealTop = aboutContent.getBoundingClientRect().top;
  const revealBottom = aboutContent.getBoundingClientRect().bottom;

  if (revealTop < windowHeight - 100 && revealBottom > 0) {
    aboutContent.classList.add("visible");
    window.removeEventListener("scroll", revealAbout);
  }
}

window.addEventListener("scroll", revealAbout);
window.addEventListener("load", revealAbout);

/* =========================
   HEART CONFETTI (COUPLES ONLY)
   ========================= */
function createHearts() {
  const container = document.getElementById("hearts");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < 20; i++) {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.innerHTML = "❤️";

    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = (3 + Math.random() * 2) + "s";
    heart.style.fontSize = (16 + Math.random() * 14) + "px";

    container.appendChild(heart);

    setTimeout(() => {
      if (heart.parentNode) heart.remove();
    }, 5000);
  }
}

/* =========================
   POPUP LOGIC
   ========================= */
const popup = document.getElementById("popup");

setTimeout(() => {
  if (!popup) return;

  popup.classList.add("show");

  if (popup.classList.contains("couples-popup")) {
    createHearts();
  }
}, 3000);

function closePopup() {
  if (!popup) return;

  popup.classList.remove("show");

  const heartsContainer = document.getElementById("hearts");
  if (heartsContainer) {
    heartsContainer.innerHTML = "";
  }
}

/* =========================
   IMAGE COLOR TOGGLE
   ========================= */
function toggleColor(image) {
  if (image) {
    image.classList.toggle("color");
  }
}

/* =========================
   CLOSE POPUP WITH ESC KEY 
   ========================= */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popup && popup.classList.contains('show')) {
    closePopup();
  }
});

/* =========================
   CLOSE POPUP WHEN CLICKING OUTSIDE 
   ========================= */
if (popup) {
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      closePopup();
    }
  });
}

/* =========================
   SMOOTH SCROLL FOR NAV LINKS
   ========================= */
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

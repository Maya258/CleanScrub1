/* =========================
   WHATSAPP BOOKING
   ========================= */
function openWhatsApp(service) {
  const phone = "27670626007";
  let message = "";

  switch(service) {
    case "mattress":
      message = "Hi Clean Scrub, I would like to book a Mattress Cleaning service.";
      break;
    case "couch":
      message = "Hi Clean Scrub, I would like to book a Couch Cleaning service.";
      break;
    case "carpet":
      message = "Hi Clean Scrub, I would like to book a Carpet Cleaning service.";
      break;
    default:
      message = "Hi Clean Scrub, I would like to book a cleaning service.";
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}


/* =========================
   WHATSAPP BUTTON ANIMATION
   ========================= */
window.addEventListener("load", () => {
  const btn = document.querySelector(".whatsapp-btn");
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

  if (revealTop < windowHeight - 100) {
    aboutContent.classList.add("visible");
    window.removeEventListener("scroll", revealAbout);
  }
}

window.addEventListener("scroll", revealAbout);
window.addEventListener("load", revealAbout);

const circleCards = document.querySelectorAll('.circle-card');

circleCards.forEach(card => {
  card.addEventListener('click', () => {
    // Collapse other cards
    circleCards.forEach(c => {
      if (c !== card) c.classList.remove('expanded');
    });
    // Toggle this card
    card.classList.toggle('expanded');
  });
});



/* =========================
   HEART CONFETTI (COUPLES ONLY)
   ========================= */
function createHearts() {
  const container = document.getElementById("hearts");
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.innerHTML = "❤️";

    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = 3 + Math.random() * 2 + "s";
    heart.style.fontSize = 16 + Math.random() * 14 + "px";

    container.appendChild(heart);

    setTimeout(() => heart.remove(), 5000);
  }
}

/* =========================
   POPUP LOGIC
   ========================= */
const popup = document.getElementById("popup");

// Show popup after 3 seconds
setTimeout(() => {
  if (!popup) return;

  popup.classList.add("show");

  // Hearts ONLY for Couples Special popup
  if (popup.classList.contains("couples-popup")) {
    createHearts();
  }
}, 3000);

// Close popup
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
  image.classList.toggle("color");
}

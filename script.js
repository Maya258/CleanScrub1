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

const aboutContent = document.querySelector(".about-content");

function revealAbout() {
  const windowHeight = window.innerHeight;
  const revealTop = aboutContent.getBoundingClientRect().top;

  if (revealTop < windowHeight - 100) {
    aboutContent.classList.add("visible");
    window.removeEventListener("scroll", revealAbout);
  }
}

window.addEventListener("scroll", revealAbout);
window.addEventListener("load", revealAbout);

const popup = document.getElementById("popup");

// Show popup after 3 seconds
setTimeout(() => {
  popup.classList.add("show");
}, 3000);

function closePopup() {
  popup.classList.remove("show");
}

function toggleColor(image) {
  image.classList.toggle("color");
}


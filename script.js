/* =========================
   SUPABASE CONNECTION
   ========================= */
const SUPABASE_URL = "https://mfkvbikubmuzbvxcrmin.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q2AJqR-4iNFkQX_kEQORlA_4UGTw78s";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/* =========================
   BOOKING CONFIGURATION
   ========================= */
const bookingSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00"];

const services = {
  car: [
    "Wash & Go - R70",
    "Wash & Wipe - R100 to R120",
    "Wash & Wax - R100 to R120",
    "Foam Wash - R120 to R150",
    "Steam Cleaning - R100 to R250",
    "Full Valet - R700 to R750",
    "Seat Cleaning - R400",
    "Interior Cleaning - R80",
    "Headlight Restore - R200",
    "Tire Shine Only - R40",
    "Engine Cleaning - R100",
    "Vacuum Only - R50",
    "Leather Treatment - R50",
    "Roof Lining Cleaning - R250",
    "Buff & Polish - R650 to R700"
  ],
  upholstery: [
    "2 Seater Couch - Standard R300",
    "2 Seater Couch - Deep R450",
    "3 Seater Couch - Standard R380",
    "3 Seater Couch - Deep R560",
    "4 Seater Couch - Standard R460",
    "4 Seater Couch - Deep R660",
    "5 Seater Couch - Standard R540",
    "5 Seater Couch - Deep R760",
    "Single Mattress - Standard R220",
    "Single Mattress - Deep R340",
    "3/4 Mattress - Standard R260",
    "3/4 Mattress - Deep R400",
    "Double Mattress - Standard R300",
    "Double Mattress - Deep R460",
    "King/Queen Mattress - Standard R340",
    "King/Queen Mattress - Deep R520",
    "Small Ottoman - R80",
    "Medium Ottoman - R130",
    "Large Ottoman - R180",
    "Storage Ottoman (Buttons) - R230"
  ]
};

/* =========================
   WHATSAPP BOOKING
   ========================= */
function openWhatsApp() {
  const phone = "27676648789";
  const message = "Hi Clean Scrub, I would like to book a cleaning service.";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function openWhatsAppScents() {
  const phone = "27676648789";
  const message = "Hi Clean Scrub, I would like to order one of your premium car scents for R30.";
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}

function openBookingWhatsApp(booking) {
  const phone = "27676648789";
  const message = [
    "New Clean Scrub Booking 🚗✨",
    "",
    `Name: ${booking.customer_name}`,
    `Contact: ${booking.phone}`,
    `Service: ${booking.service}`,
    `Vehicle / Item: ${booking.item_details || "Not provided"}`,
    `Date: ${formatDateForDisplay(booking.booking_date)}`,
    `Time: ${booking.booking_time}`,
    `Notes: ${booking.notes || "None"}`,
    "",
    "Please confirm my booking. Thank you!"
  ].join("\n");

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
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
  const rect = aboutContent.getBoundingClientRect();

  if (rect.top < windowHeight - 100 && rect.bottom > 0) {
    aboutContent.classList.add("visible");
    window.removeEventListener("scroll", revealAbout);
  }
}

window.addEventListener("scroll", revealAbout);
window.addEventListener("load", revealAbout);

/* =========================
   POPUP LOGIC
   ========================= */
const popup = document.getElementById("popup");

setTimeout(() => {
  if (popup) popup.classList.add("show");
}, 3000);

function closePopup() {
  if (!popup) return;
  popup.classList.remove("show");

  const heartsContainer = document.getElementById("hearts");
  if (heartsContainer) heartsContainer.innerHTML = "";
}

/* =========================
   GALLERY LIGHTBOX
   ========================= */
const imageLightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");

function openLightbox(image) {
  if (!imageLightbox || !lightboxImage || !image) return;
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  imageLightbox.classList.add("show");
  imageLightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeLightbox() {
  if (!imageLightbox || !lightboxImage) return;
  imageLightbox.classList.remove("show");
  imageLightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  document.body.classList.remove("modal-open");
}

if (imageLightbox) {
  imageLightbox.addEventListener("click", (event) => {
    if (event.target === imageLightbox) closeLightbox();
  });
}

/* =========================
   BOOKING FORM
   ========================= */
const bookingForm = document.getElementById("bookingForm");
const serviceCategory = document.getElementById("serviceCategory");
const serviceSelect = document.getElementById("serviceSelect");
const bookingDate = document.getElementById("bookingDate");
const bookingTime = document.getElementById("bookingTime");
const slotMessage = document.getElementById("slotMessage");
const bookingStatus = document.getElementById("bookingStatus");
const bookingSubmit = document.getElementById("bookingSubmit");
const bookingSummary = document.getElementById("bookingSummary");

function todayLocalISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

if (bookingDate) bookingDate.min = todayLocalISO();

if (serviceCategory && serviceSelect) {
  serviceCategory.addEventListener("change", () => {
    serviceSelect.innerHTML = '<option value="">Select a service</option>';

    const selectedServices = services[serviceCategory.value] || [];
    selectedServices.forEach((service) => {
      const option = document.createElement("option");
      option.value = service;
      option.textContent = service;
      serviceSelect.appendChild(option);
    });

    serviceSelect.disabled = selectedServices.length === 0;
    updateBookingSummary();
  });
}

if (bookingDate) {
  bookingDate.addEventListener("change", async () => {
    await loadAvailableSlots(bookingDate.value);
    updateBookingSummary();
  });
}

if (serviceSelect) serviceSelect.addEventListener("change", updateBookingSummary);
if (bookingTime) bookingTime.addEventListener("change", updateBookingSummary);

async function loadAvailableSlots(date) {
  if (!bookingTime || !slotMessage) return;

  bookingTime.disabled = true;
  bookingTime.innerHTML = '<option value="">Checking availability...</option>';
  slotMessage.textContent = "Checking available slots...";
  slotMessage.className = "slot-message";

  if (!date) {
    bookingTime.innerHTML = '<option value="">Choose a date first</option>';
    slotMessage.textContent = "Select a date to view available slots.";
    return;
  }

  if (!supabaseClient) {
    bookingTime.innerHTML = '<option value="">Unable to connect</option>';
    slotMessage.textContent = "Booking connection is unavailable. Please try again later.";
    slotMessage.className = "slot-message error";
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("booking_slots")
      .select("booking_time")
      .eq("booking_date", date);

    if (error) throw error;

    const booked = new Set((data || []).map((row) => row.booking_time));
    const available = bookingSlots.filter((slot) => !booked.has(slot));

    bookingTime.innerHTML = '<option value="">Select a time</option>';

    available.forEach((slot) => {
      const option = document.createElement("option");
      option.value = slot;
      option.textContent = slot;
      bookingTime.appendChild(option);
    });

    if (available.length) {
      bookingTime.disabled = false;
      slotMessage.textContent = `${available.length} slot${available.length === 1 ? "" : "s"} available for this date.`;
      slotMessage.className = "slot-message success";
    } else {
      bookingTime.disabled = true;
      bookingTime.innerHTML = '<option value="">Fully booked</option>';
      slotMessage.textContent = "No slots are available on this date. Please choose another date.";
      slotMessage.className = "slot-message error";
    }
  } catch (error) {
    console.error("Availability error:", error);
    bookingTime.innerHTML = '<option value="">Unable to load slots</option>';
    slotMessage.textContent = "We could not check availability. Please refresh and try again.";
    slotMessage.className = "slot-message error";
  }
}

function updateBookingSummary() {
  if (!bookingSummary) return;

  const service = serviceSelect?.value;
  const date = bookingDate?.value;
  const time = bookingTime?.value;
  const hasSummary = service || date || time;

  bookingSummary.hidden = !hasSummary;
  if (!hasSummary) return;

  document.getElementById("summaryService").textContent = service || "Not selected";
  document.getElementById("summaryDate").textContent = date ? formatDateForDisplay(date) : "Not selected";
  document.getElementById("summaryTime").textContent = time || "Not selected";
}

function formatDateForDisplay(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabaseClient) {
      setBookingStatus("Booking connection is unavailable. Please contact us on WhatsApp.", "error");
      return;
    }

    const booking = {
      customer_name: document.getElementById("customerName").value.trim(),
      phone: document.getElementById("customerPhone").value.trim(),
      service: serviceSelect.value,
      item_details: document.getElementById("itemDetails").value.trim() || null,
      booking_date: bookingDate.value,
      booking_time: bookingTime.value,
      notes: document.getElementById("bookingNotes").value.trim() || null,
      status: "Pending"
    };

    if (!booking.customer_name || !booking.phone || !booking.service || !booking.booking_date || !booking.booking_time) {
      setBookingStatus("Please complete all required booking fields.", "error");
      return;
    }

    setBookingLoading(true);
    setBookingStatus("Saving your booking...", "loading");

    try {
      const { error } = await supabaseClient.from("bookings").insert([booking]);

      if (error) {
        if (error.code === "23505") {
          setBookingStatus("That time was just booked by someone else. Please choose another available slot.", "error");
          await loadAvailableSlots(booking.booking_date);
          return;
        }
        throw error;
      }

      setBookingStatus("Booking saved! Opening WhatsApp so you can send your confirmation to Clean Scrub.", "success");

      const confirmedBooking = { ...booking };
      bookingForm.reset();
      serviceSelect.disabled = true;
      serviceSelect.innerHTML = '<option value="">Choose a service type first</option>';
      bookingTime.disabled = true;
      bookingTime.innerHTML = '<option value="">Choose a date first</option>';
      slotMessage.textContent = "Select a date to view available slots.";
      slotMessage.className = "slot-message";
      bookingSummary.hidden = true;
      bookingDate.min = todayLocalISO();

      setTimeout(() => openBookingWhatsApp(confirmedBooking), 700);
    } catch (error) {
      console.error("Booking error:", error);
      setBookingStatus("We could not save your booking. Please try again or contact Clean Scrub on WhatsApp.", "error");
    } finally {
      setBookingLoading(false);
    }
  });
}

function setBookingLoading(isLoading) {
  if (!bookingSubmit) return;
  bookingSubmit.disabled = isLoading;
  bookingSubmit.textContent = isLoading ? "Saving Booking..." : "Confirm Booking";
}

function setBookingStatus(message, type = "") {
  if (!bookingStatus) return;
  bookingStatus.textContent = message;
  bookingStatus.className = `booking-status ${type}`.trim();
}

/* =========================
   CLOSE MODALS WITH ESC KEY
   ========================= */
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (popup && popup.classList.contains("show")) closePopup();
  if (imageLightbox && imageLightbox.classList.contains("show")) closeLightbox();
});

/* =========================
   CLOSE POPUP WHEN CLICKING OUTSIDE
   ========================= */
if (popup) {
  popup.addEventListener("click", (event) => {
    if (event.target === popup) closePopup();
  });
}

/* =========================
   SMOOTH SCROLL FOR NAV + BOOKING LINKS
   ========================= */
document.querySelectorAll('.nav a, a[href="#booking"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || !targetId.startsWith("#")) return;

    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    event.preventDefault();
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

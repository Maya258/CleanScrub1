/* =========================
   CLEAN SCRUB ADMIN
   ========================= */
const SUPABASE_URL = "https://mfkvbikubmuzbvxcrmin.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q2AJqR-4iNFkQX_kEQORlA_4UGTw78s";
const adminSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginPanel = document.getElementById("adminLoginPanel");
const dashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("adminLoginForm");
const loginButton = document.getElementById("adminLoginButton");
const loginStatus = document.getElementById("adminLoginStatus");
const dashboardStatus = document.getElementById("adminDashboardStatus");
const bookingsBody = document.getElementById("adminBookingsBody");
const emptyState = document.getElementById("adminEmptyState");
const resultCount = document.getElementById("bookingResultCount");
const searchInput = document.getElementById("bookingSearch");
const dateFilter = document.getElementById("adminDateFilter");
const statusFilter = document.getElementById("adminStatusFilter");
const clearFilters = document.getElementById("clearAdminFilters");
const refreshButton = document.getElementById("refreshBookings");
const logoutButton = document.getElementById("adminLogout");

let allBookings = [];
let allReceipts = [];
let activeReceiptBooking = null;
let allExpenses = [];

const ADMIN_BOOKING_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"];
const ADMIN_SERVICES = [
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
  "Buff & Polish - R650 to R700",
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
];

function localTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function setLoginMessage(message = "", type = "") {
  loginStatus.textContent = message;
  loginStatus.className = `admin-message ${type}`.trim();
}

function setDashboardMessage(message = "", type = "") {
  dashboardStatus.textContent = message;
  dashboardStatus.className = `admin-message admin-dashboard-message ${type}`.trim();
}

async function initialiseAdmin() {
  const { data: { session } } = await adminSupabase.auth.getSession();
  if (session) {
    await showDashboard(session.user);
  } else {
    showLogin();
  }
}

function showLogin() {
  loginPanel.hidden = false;
  dashboard.hidden = true;
}

async function showDashboard(user) {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  document.getElementById("adminWelcome").textContent = `Signed in as ${user.email}`;
  await loadBookings();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  loginButton.disabled = true;
  loginButton.textContent = "Signing In...";
  setLoginMessage("Checking your account...", "loading");

  try {
    const { data, error } = await adminSupabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    setLoginMessage("");
    await showDashboard(data.user);
  } catch (error) {
    console.error(error);
    setLoginMessage("Unable to sign in. Check your email and password, and make sure this account has admin access.", "error");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
});

logoutButton.addEventListener("click", async () => {
  await adminSupabase.auth.signOut();
  allBookings = [];
  loginForm.reset();
  showLogin();
});

refreshButton.addEventListener("click", loadBookings);

async function loadBookings() {
  setDashboardMessage("Loading bookings...", "loading");
  refreshButton.disabled = true;

  try {
    const { data, error } = await adminSupabase
      .from("bookings")
      .select("id, customer_name, phone, service, item_details, booking_date, booking_time, notes, status, created_at")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (error) throw error;

    allBookings = data || [];
    await Promise.all([loadReceipts(), loadExpenses()]);
    updateStats();
    renderBookings();
    renderTodaySchedule();
    renderMonthlyReport();
    renderExpenses();
    setDashboardMessage("");
  } catch (error) {
    console.error(error);
    allBookings = [];
    renderBookings();
    setDashboardMessage("Bookings could not be loaded. If you have just created the admin page, run the Admin Security SQL in Supabase and add your login as an admin.", "error");
  } finally {
    refreshButton.disabled = false;
  }
}

async function loadReceipts() {
  const { data, error } = await adminSupabase.from("receipts")
    .select("id, booking_id, receipt_number, customer_name, phone, service, amount, payment_method, payment_status, note, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  allReceipts = data || [];
}
async function loadExpenses() {
  const { data, error } = await adminSupabase
    .from("expenses")
    .select("id, expense_date, description, category, amount, created_at")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  allExpenses = data || [];
}

function money(value) { return `R${Number(value || 0).toFixed(2).replace(".00", "")}`; }

function updateStats() {
  const today = localTodayISO();
  document.getElementById("statToday").textContent = allBookings.filter(b => b.booking_date === today && b.status !== "Cancelled").length;
  document.getElementById("statPending").textContent = allBookings.filter(b => (b.status || "Pending") === "Pending").length;
  document.getElementById("statConfirmed").textContent = allBookings.filter(b => b.status === "Confirmed").length;
  document.getElementById("statCompleted").textContent = allBookings.filter(b => b.status === "Completed").length;
  const paid = allReceipts.filter(r => r.payment_status === "Paid");
  const cash = paid.filter(r => r.payment_method === "Cash").reduce((s,r) => s + Number(r.amount || 0), 0);
  const eft = paid.filter(r => r.payment_method === "EFT").reduce((s,r) => s + Number(r.amount || 0), 0);
  document.getElementById("statCash").textContent = money(cash);
  document.getElementById("statEft").textContent = money(eft);
  document.getElementById("statRevenue").textContent = money(cash + eft);
}

function filteredBookings() {
  const query = searchInput.value.trim().toLowerCase();
  const date = dateFilter.value;
  const status = statusFilter.value;

  return allBookings.filter((booking) => {
    const searchable = [
      booking.customer_name,
      booking.phone,
      booking.service,
      booking.item_details,
      booking.notes
    ].filter(Boolean).join(" ").toLowerCase();

    const matchesSearch = !query || searchable.includes(query);
    const matchesDate = !date || booking.booking_date === date;
    const bookingStatus = booking.status || "Pending";
    const matchesStatus = status === "all" || bookingStatus === status;

    return matchesSearch && matchesDate && matchesStatus;
  });
}

function renderBookings() {
  const bookings = filteredBookings();
  resultCount.textContent = `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`;
  emptyState.hidden = bookings.length !== 0;
  bookingsBody.innerHTML = "";

  bookings.forEach((booking) => {
    const row = document.createElement("tr");
    const status = booking.status || "Pending";

    row.innerHTML = `
      <td data-label="Date & Time">
        <strong>${escapeHtml(formatDate(booking.booking_date))}</strong>
        <span class="admin-time">${escapeHtml(booking.booking_time)}</span>
      </td>
      <td data-label="Customer">
        <strong>${escapeHtml(booking.customer_name)}</strong>
        <a class="admin-phone" href="tel:${escapeHtml(booking.phone)}">${escapeHtml(booking.phone)}</a>
      </td>
      <td data-label="Service"><span class="admin-service-text">${escapeHtml(booking.service)}</span></td>
      <td data-label="Vehicle / Item">${escapeHtml(booking.item_details || "—")}</td>
      <td data-label="Notes"><span class="admin-notes">${escapeHtml(booking.notes || "—")}</span></td>
      <td data-label="Status">
        <select class="admin-status-select status-${status.toLowerCase()}" data-booking-id="${booking.id}">
          <option value="Pending" ${status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Confirmed" ${status === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="Completed" ${status === "Completed" ? "selected" : ""}>Completed</option>
          <option value="Cancelled" ${status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
      <td data-label="Payment">
        ${(() => {
          const r = allReceipts.find(x => Number(x.booking_id) === Number(booking.id));
          return r ? `<span class="payment-badge ${r.payment_status.toLowerCase()}">${escapeHtml(r.payment_method)} · ${escapeHtml(r.payment_status)}</span><small class="receipt-number">${escapeHtml(r.receipt_number)}</small>` : `<span class="payment-badge none">No receipt</span>`;
        })()}
      </td>
      <td data-label="Actions">
        <div class="admin-row-actions">
          <button type="button" class="admin-save-status" data-booking-id="${booking.id}">Save</button>
          <button type="button" class="admin-whatsapp-customer" data-booking-id="${booking.id}">WhatsApp</button>
          <button type="button" class="admin-receipt-btn" data-booking-id="${booking.id}">${allReceipts.some(r => Number(r.booking_id) === Number(booking.id)) ? "View Receipt" : "Receipt"}</button>
        </div>
      </td>
    `;

    bookingsBody.appendChild(row);
  });

  document.querySelectorAll(".admin-save-status").forEach((button) => {
    button.addEventListener("click", () => saveBookingStatus(Number(button.dataset.bookingId), button));
  });

  document.querySelectorAll(".admin-whatsapp-customer").forEach((button) => {
    button.addEventListener("click", () => whatsappCustomer(Number(button.dataset.bookingId)));
  });
  document.querySelectorAll(".admin-receipt-btn").forEach((button) => {
    button.addEventListener("click", () => openReceipt(Number(button.dataset.bookingId)));
  });

  document.querySelectorAll(".admin-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      select.className = `admin-status-select status-${select.value.toLowerCase()}`;
    });
  });
}

async function saveBookingStatus(id, button) {
  const select = document.querySelector(`.admin-status-select[data-booking-id="${id}"]`);
  if (!select) return;

  button.disabled = true;
  button.textContent = "Saving...";
  setDashboardMessage("");

  try {
    const { error } = await adminSupabase
      .from("bookings")
      .update({ status: select.value })
      .eq("id", id);

    if (error) throw error;

    const record = allBookings.find(b => Number(b.id) === id);
    if (record) record.status = select.value;
    updateStats();
    renderBookings();
    renderTodaySchedule();
    renderMonthlyReport();
    setDashboardMessage(`Booking marked as ${select.value}.`, "success");
  } catch (error) {
    console.error(error);
    setDashboardMessage("The booking status could not be updated. Please try again.", "error");
    button.disabled = false;
    button.textContent = "Save";
  }
}

function normaliseWhatsAppNumber(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `27${digits.slice(1)}`;
  return digits;
}

function whatsappCustomer(id) {
  const booking = allBookings.find(b => Number(b.id) === id);
  if (!booking) return;

  const phone = normaliseWhatsAppNumber(booking.phone);
  const status = booking.status || "Pending";
  const message = [
    `Hi ${booking.customer_name},`,
    "",
    `This is Clean Scrub regarding your ${booking.service} booking on ${formatDate(booking.booking_date)} at ${booking.booking_time}.`,
    `Booking status: ${status}.`,
    "",
    "Thank you."
  ].join("\n");

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}


const receiptModal = document.getElementById("receiptModal");
const receiptClose = document.getElementById("receiptClose");
const receiptEditor = document.getElementById("receiptEditor");
const receiptPreview = document.getElementById("receiptPreview");
const receiptStatus = document.getElementById("receiptStatus");

function inferAmount(service = "") {
  const amounts = [...String(service).matchAll(/R\s?(\d+(?:\.\d+)?)/gi)].map(m => Number(m[1]));
  return amounts.length ? amounts[0] : "";
}
function openReceipt(id) {
  const booking = allBookings.find(b => Number(b.id) === id);
  if (!booking) return;
  activeReceiptBooking = booking;
  const existing = allReceipts.find(r => Number(r.booking_id) === id);
  receiptModal.classList.add("show");
  receiptModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (existing) return showReceiptPreview(existing, booking);
  receiptPreview.hidden = true; receiptEditor.hidden = false;
  document.getElementById("receiptCustomer").value = booking.customer_name || "";
  document.getElementById("receiptService").value = booking.service || "";
  document.getElementById("receiptAmount").value = inferAmount(booking.service);
  document.getElementById("receiptPaymentMethod").value = "Cash";
  document.getElementById("receiptPaymentStatus").value = "Paid";
  document.getElementById("receiptNote").value = "";
  receiptStatus.textContent = "";
}
function closeReceipt() {
  receiptModal.classList.remove("show");
  receiptModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  activeReceiptBooking = null;
}
receiptClose.addEventListener("click", closeReceipt);
receiptModal.addEventListener("click", e => { if (e.target === receiptModal) closeReceipt(); });

document.getElementById("generateReceipt").addEventListener("click", async () => {
  if (!activeReceiptBooking) return;
  const amount = Number(document.getElementById("receiptAmount").value);
  if (!Number.isFinite(amount) || amount < 0) {
    receiptStatus.textContent = "Enter a valid amount."; receiptStatus.className = "admin-message error"; return;
  }
  receiptStatus.textContent = "Creating receipt..."; receiptStatus.className = "admin-message loading";
  const payload = {
    booking_id: activeReceiptBooking.id,
    customer_name: activeReceiptBooking.customer_name,
    phone: activeReceiptBooking.phone,
    service: activeReceiptBooking.service,
    amount,
    payment_method: document.getElementById("receiptPaymentMethod").value,
    payment_status: document.getElementById("receiptPaymentStatus").value,
    note: document.getElementById("receiptNote").value.trim() || null
  };
  const { data, error } = await adminSupabase.from("receipts").insert(payload).select().single();
  if (error) {
    console.error(error);
    receiptStatus.textContent = "Receipt could not be created. Make sure receipt_setup.sql was run in Supabase.";
    receiptStatus.className = "admin-message error"; return;
  }
  allReceipts.unshift(data); updateStats(); renderBookings(); renderMonthlyReport(); showReceiptPreview(data, activeReceiptBooking);
});
function showReceiptPreview(receipt, booking) {
  receiptEditor.hidden = true; receiptPreview.hidden = false;
  const created = new Date(receipt.created_at).toLocaleString("en-ZA", {dateStyle:"medium", timeStyle:"short"});
  receiptPreview.innerHTML = `
    <div class="receipt-paper" id="printableReceipt">
      <div class="receipt-brand"><img src="logo.png" alt="Clean Scrub"><div><h2>Clean Scrub</h2><p>26 Paul Kruger, Kensington, Gqeberha</p></div></div>
      <div class="receipt-title"><strong>RECEIPT</strong><span>${escapeHtml(receipt.receipt_number)}</span></div>
      <div class="receipt-details">
        <p><span>Date</span><strong>${escapeHtml(created)}</strong></p>
        <p><span>Customer</span><strong>${escapeHtml(receipt.customer_name)}</strong></p>
        <p><span>Service</span><strong>${escapeHtml(receipt.service)}</strong></p>
        <p><span>Payment</span><strong>${escapeHtml(receipt.payment_method)}</strong></p>
        <p><span>Status</span><strong>${escapeHtml(receipt.payment_status)}</strong></p>
        ${receipt.note ? `<p><span>Note</span><strong>${escapeHtml(receipt.note)}</strong></p>` : ""}
      </div>
      <div class="receipt-total"><span>Total</span><strong>${money(receipt.amount)}</strong></div>
      <p class="receipt-thanks">Thank you for choosing Clean Scrub!</p>
    </div>
    <div class="receipt-actions">
      <button type="button" class="receipt-primary-btn" onclick="printReceipt()">Print / Save PDF</button>
      <button type="button" class="admin-whatsapp-customer" onclick="whatsappReceipt(${Number(booking.id)})">WhatsApp Receipt</button>
      <button type="button" class="admin-outline-btn" onclick="closeReceipt()">Close</button>
    </div>`;
}
function printReceipt() {
  const receipt = document.getElementById("printableReceipt");
  if (!receipt) return;

  const printWindow = window.open("", "_blank", "width=760,height=900");
  if (!printWindow) {
    alert("Please allow pop-ups so the receipt can open for printing.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Clean Scrub Receipt</title>
      <style>
        @page {
          size: A4;
          margin: 12mm;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #f3f7fa;
          font-family: Arial, Helvetica, sans-serif;
          color: #040b29;
        }

        .print-page {
          width: 100%;
          min-height: auto;
          display: flex;
          justify-content: center;
          padding: 18px;
        }

        .receipt-paper {
          width: 100%;
          max-width: 680px;
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 35px rgba(4, 11, 41, 0.08);
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .receipt-brand {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 3px solid #0aa2dd;
        }

        .receipt-brand img {
          width: 78px;
          height: 60px;
          object-fit: contain;
        }

        .receipt-brand h2 {
          margin: 0;
          color: #0aa2dd;
          font-size: 25px;
        }

        .receipt-brand p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .receipt-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 24px 0 16px;
          padding: 13px 16px;
          background: #f1f9fc;
          border-radius: 12px;
        }

        .receipt-title strong {
          letter-spacing: 1.5px;
          font-size: 14px;
        }

        .receipt-title span {
          color: #0aa2dd;
          font-size: 17px;
          font-weight: 700;
        }

        .receipt-details p {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 20px;
          margin: 0;
          padding: 11px 4px;
          border-bottom: 1px dashed #d9e5ec;
          font-size: 13px;
        }

        .receipt-details span {
          color: #64748b;
        }

        .receipt-details strong {
          text-align: right;
          overflow-wrap: anywhere;
        }

        .receipt-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 18px;
          background: #040b29;
          color: #ffffff;
          border-radius: 14px;
        }

        .receipt-total span {
          font-size: 14px;
          font-weight: 700;
        }

        .receipt-total strong {
          color: #ffffff;
          font-size: 28px;
        }

        .receipt-thanks {
          margin: 22px 0 4px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }

        .receipt-footer {
          margin-top: 10px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
        }

        @media print {
          html, body {
            background: #ffffff;
          }

          .print-page {
            padding: 0;
          }

          .receipt-paper {
            max-width: 100%;
            box-shadow: none;
            border: 1px solid #dbeafe;
          }
        }
      </style>
    </head>
    <body>
      <main class="print-page">
        ${receipt.outerHTML}
      </main>
      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 250);
        };
        window.onafterprint = function () {
          window.close();
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
function whatsappReceipt(id) {
  const b = allBookings.find(x => Number(x.id) === id);
  const r = allReceipts.find(x => Number(x.booking_id) === id);
  if (!b || !r) return;
  const msg = [`Hi ${b.customer_name},`,"","Thank you for choosing Clean Scrub.",`Receipt: ${r.receipt_number}`,`Service: ${r.service}`,`Amount: ${money(r.amount)}`,`Payment: ${r.payment_method}`,`Status: ${r.payment_status}`,"","Clean Scrub"].join("\n");
  window.open(`https://wa.me/${normaliseWhatsAppNumber(b.phone)}?text=${encodeURIComponent(msg)}`, "_blank");
}


/* =========================
   TODAY'S SCHEDULE
   ========================= */
function renderTodaySchedule() {
  const container = document.getElementById("todaySchedule");
  const dateLabel = document.getElementById("todayScheduleDate");
  if (!container || !dateLabel) return;

  const today = localTodayISO();
  dateLabel.textContent = formatDate(today);

  const todaysBookings = allBookings
    .filter(b => b.booking_date === today && (b.status || "Pending") !== "Cancelled")
    .sort((a,b) => String(a.booking_time).localeCompare(String(b.booking_time)));

  const byTime = new Map(todaysBookings.map(b => [b.booking_time, b]));
  container.innerHTML = ADMIN_BOOKING_SLOTS.map(time => {
    const b = byTime.get(time);
    if (!b) {
      return `<div class="schedule-row available"><span class="schedule-time">${time}</span><div><strong>Available</strong><small>Open booking slot</small></div></div>`;
    }
    return `<div class="schedule-row booked">
      <span class="schedule-time">${escapeHtml(time)}</span>
      <div class="schedule-info">
        <strong>${escapeHtml(b.customer_name)}</strong>
        <small>${escapeHtml(b.service)} · ${escapeHtml(b.status || "Pending")}</small>
      </div>
      <button type="button" class="schedule-whatsapp" onclick="whatsappCustomer(${Number(b.id)})">WhatsApp</button>
    </div>`;
  }).join("");
}

/* =========================
   MONTHLY REPORT
   ========================= */
const reportMonth = document.getElementById("reportMonth");

function currentMonthValue() {
  return localTodayISO().slice(0,7);
}

function renderMonthlyReport() {
  if (!reportMonth) return;
  const month = reportMonth.value || currentMonthValue();
  if (!reportMonth.value) reportMonth.value = month;

  const receipts = allReceipts.filter(r => r.payment_status === "Paid" && String(r.created_at || "").slice(0,7) === month);
  const expenses = allExpenses.filter(e => String(e.expense_date || "").slice(0,7) === month);

  const cash = receipts.filter(r => r.payment_method === "Cash").reduce((s,r) => s + Number(r.amount || 0),0);
  const eft = receipts.filter(r => r.payment_method === "EFT").reduce((s,r) => s + Number(r.amount || 0),0);
  const revenue = cash + eft;
  const expenseTotal = expenses.reduce((s,e) => s + Number(e.amount || 0),0);
  const profit = revenue - expenseTotal;

  document.getElementById("monthRevenue").textContent = money(revenue);
  document.getElementById("monthExpenses").textContent = money(expenseTotal);
  document.getElementById("monthProfit").textContent = money(profit);
  document.getElementById("monthPaidJobs").textContent = receipts.length;
  document.getElementById("monthCash").textContent = money(cash);
  document.getElementById("monthEft").textContent = money(eft);

  const profitEl = document.getElementById("monthProfit");
  profitEl.classList.toggle("negative-profit", profit < 0);
  renderExpenses();
}

reportMonth?.addEventListener("change", renderMonthlyReport);

/* =========================
   EXPENSES
   ========================= */
const expenseForm = document.getElementById("expenseForm");
const expenseStatus = document.getElementById("expenseStatus");

document.getElementById("toggleExpenseForm")?.addEventListener("click", () => {
  expenseForm.hidden = !expenseForm.hidden;
  if (!expenseForm.hidden && !document.getElementById("expenseDate").value) {
    document.getElementById("expenseDate").value = localTodayISO();
  }
});

expenseForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById("expenseAmount").value);
  if (!Number.isFinite(amount) || amount < 0) return;

  expenseStatus.textContent = "Saving expense...";
  expenseStatus.className = "admin-message loading";

  const payload = {
    expense_date: document.getElementById("expenseDate").value,
    description: document.getElementById("expenseDescription").value.trim(),
    category: document.getElementById("expenseCategory").value,
    amount
  };

  const { data, error } = await adminSupabase.from("expenses").insert(payload).select().single();
  if (error) {
    console.error(error);
    expenseStatus.textContent = "Expense could not be saved. Run business_admin_setup.sql in Supabase first.";
    expenseStatus.className = "admin-message error";
    return;
  }

  allExpenses.unshift(data);
  expenseForm.reset();
  document.getElementById("expenseDate").value = localTodayISO();
  expenseStatus.textContent = "Expense saved.";
  expenseStatus.className = "admin-message success";
  renderMonthlyReport();
});

function renderExpenses() {
  const body = document.getElementById("expenseBody");
  const empty = document.getElementById("expenseEmpty");
  if (!body || !empty) return;

  const month = reportMonth?.value || currentMonthValue();
  const items = allExpenses
    .filter(e => String(e.expense_date || "").slice(0,7) === month)
    .sort((a,b) => String(b.expense_date).localeCompare(String(a.expense_date)));

  body.innerHTML = items.map(e => `<tr>
    <td>${escapeHtml(formatDate(e.expense_date))}</td>
    <td>${escapeHtml(e.description)}</td>
    <td>${escapeHtml(e.category)}</td>
    <td><strong>${money(e.amount)}</strong></td>
    <td><button type="button" class="expense-delete" data-expense-id="${e.id}">Delete</button></td>
  </tr>`).join("");

  empty.hidden = items.length > 0;

  body.querySelectorAll(".expense-delete").forEach(btn => {
    btn.addEventListener("click", () => deleteExpense(Number(btn.dataset.expenseId)));
  });
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  const { error } = await adminSupabase.from("expenses").delete().eq("id", id);
  if (error) {
    console.error(error);
    setDashboardMessage("Expense could not be deleted.", "error");
    return;
  }
  allExpenses = allExpenses.filter(e => Number(e.id) !== id);
  renderMonthlyReport();
}

/* =========================
   MANUAL BOOKING
   ========================= */
const manualModal = document.getElementById("manualBookingModal");
const manualForm = document.getElementById("manualBookingForm");
const manualService = document.getElementById("manualService");
const manualDate = document.getElementById("manualDate");
const manualTime = document.getElementById("manualTime");
const manualStatus = document.getElementById("manualBookingStatus");

function populateManualServices() {
  manualService.innerHTML = `<option value="">Choose a service</option>` +
    ADMIN_SERVICES.map(service => `<option value="${escapeHtml(service)}">${escapeHtml(service)}</option>`).join("");
}
function updateManualTimes() {
  const date = manualDate.value;
  const booked = new Set(
    allBookings
      .filter(b => b.booking_date === date && (b.status || "Pending") !== "Cancelled")
      .map(b => b.booking_time)
  );
  manualTime.innerHTML = `<option value="">Choose a time</option>` +
    ADMIN_BOOKING_SLOTS.map(t => `<option value="${t}" ${booked.has(t) ? "disabled" : ""}>${t}${booked.has(t) ? " — Booked" : ""}</option>`).join("");
}
function openManualBookingModal() {
  manualModal.classList.add("show");
  manualModal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  manualForm.reset();
  manualDate.value = localTodayISO();
  manualDate.min = localTodayISO();
  populateManualServices();
  updateManualTimes();
  manualStatus.textContent = "";
}
function closeManualBookingModal() {
  manualModal.classList.remove("show");
  manualModal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}

document.getElementById("openManualBooking")?.addEventListener("click", openManualBookingModal);
document.getElementById("manualBookingClose")?.addEventListener("click", closeManualBookingModal);
manualModal?.addEventListener("click", e => { if (e.target === manualModal) closeManualBookingModal(); });
manualDate?.addEventListener("change", updateManualTimes);

manualForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.getElementById("manualBookingSubmit");
  button.disabled = true;
  button.textContent = "Saving...";
  manualStatus.textContent = "Saving booking...";
  manualStatus.className = "admin-message loading";

  const payload = {
    customer_name: document.getElementById("manualCustomerName").value.trim(),
    phone: document.getElementById("manualPhone").value.trim(),
    service: manualService.value,
    item_details: document.getElementById("manualItemDetails").value.trim() || null,
    booking_date: manualDate.value,
    booking_time: manualTime.value,
    notes: document.getElementById("manualNotes").value.trim() || null,
    status: document.getElementById("manualStatus").value
  };

  const { error } = await adminSupabase.from("bookings").insert(payload);
  if (error) {
    console.error(error);
    manualStatus.textContent = error.code === "23505"
      ? "That time slot has just been booked. Choose another time."
      : "Booking could not be saved.";
    manualStatus.className = "admin-message error";
    button.disabled = false;
    button.textContent = "Save Booking";
    return;
  }

  manualStatus.textContent = "Booking added successfully.";
  manualStatus.className = "admin-message success";
  await loadBookings();
  setTimeout(closeManualBookingModal, 600);
  button.disabled = false;
  button.textContent = "Save Booking";
});


[searchInput, dateFilter, statusFilter].forEach((control) => {
  control.addEventListener(control.tagName === "INPUT" && control.type === "search" ? "input" : "change", renderBookings);
});

clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  dateFilter.value = "";
  statusFilter.value = "all";
  renderBookings();
});

adminSupabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") showLogin();
  if (event === "SIGNED_IN" && session?.user) showDashboard(session.user);
});

initialiseAdmin();

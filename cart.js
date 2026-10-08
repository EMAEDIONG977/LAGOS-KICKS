const CART_KEY = "kicksCart", THEME_KEY = "kicksTheme", MAX_QTY = 10;
const fmt = n => "₦" + Number(n).toLocaleString("en-NG");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const findProduct = id => products.find(p => p.id === id);
const COLORS = ["#ff4d00", "#1d3557", "#2a9d8f", "#7b2cbf", "#e63946", "#f4a261"];
const thumbHTML = (p, extra = "") => `<div class="thumb" style="background:${COLORS[p.id % COLORS.length]}">${p.image}${extra}</div>`;

function loadCart() {
  try {
    const d = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(d)) return [];
    return d.filter(i => i && Number.isInteger(i.id) && Number.isInteger(i.size) && Number.isInteger(i.qty) && i.qty > 0 && findProduct(i.id));
  } catch (e) { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  updateBadge();
}
function addToCart(id, size, qty) {
  const cart = loadCart();
  const line = cart.find(i => i.id === id && i.size === size);
  if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
  else cart.push({ id, size, qty });
  saveCart(cart);
}
function updateBadge() {
  const n = loadCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll(".cart-count").forEach(b => { b.textContent = n; b.classList.toggle("hidden", n === 0); });
}
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200);
}
/* theme + nav (shared by both pages) */
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  const b = document.getElementById("themeBtn"); if (b) b.textContent = t === "dark" ? "☀️" : "🌙";
}
function initShared() {
  let t = "light";
  try { const s = localStorage.getItem(THEME_KEY); if (s === "dark" || s === "light") t = s; } catch (e) {}
  applyTheme(t);
  document.getElementById("themeBtn").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
  const links = document.getElementById("navLinks");
  document.getElementById("hamburger").addEventListener("click", () => links.classList.toggle("open"));
  links.addEventListener("click", () => links.classList.remove("open"));
  updateBadge();
}
document.addEventListener("DOMContentLoaded", () => { initShared(); if (document.getElementById("cartItems")) initCartPage(); });

/* ---------- cart page ---------- */
const STORE_WHATSAPP = "2347066354709"; // <-- replace with your WhatsApp number (234 + number without leading 0)

function initCartPage() {
  const itemsEl = document.getElementById("cartItems"), totalEl = document.getElementById("cartTotal");
  const content = document.getElementById("cartContent"), emptyEl = document.getElementById("emptyCart");

  function render() {
    const cart = loadCart();
    content.classList.toggle("hidden", !cart.length);
    emptyEl.classList.toggle("hidden", cart.length > 0);
    let total = 0;
    itemsEl.innerHTML = cart.map(i => {
      const p = findProduct(i.id), sub = p.price * i.qty; total += sub;
      return `<div class="cart-item">${thumbHTML(p)}
        <div><h3>${esc(p.name)}</h3><div class="brand">Size ${i.size} · ${fmt(p.price)} each</div>
          <div class="qty" style="margin-top:8px"><button data-act="dec" data-id="${i.id}" data-size="${i.size}" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button data-act="inc" data-id="${i.id}" data-size="${i.size}" aria-label="Increase quantity">+</button></div></div>
        <div class="cart-right"><strong>${fmt(sub)}</strong><button class="remove" data-act="rm" data-id="${i.id}" data-size="${i.size}">Remove</button></div></div>`;
    }).join("");
    totalEl.textContent = fmt(total);
    updateBadge();
  }
  itemsEl.addEventListener("click", e => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const id = +b.dataset.id, size = +b.dataset.size, act = b.dataset.act;
    let cart = loadCart(); const line = cart.find(i => i.id === id && i.size === size);
    if (!line) return;
    if (act === "inc") line.qty = Math.min(MAX_QTY, line.qty + 1);
    if (act === "dec") line.qty -= 1;
    if (act === "rm" || line.qty <= 0) cart = cart.filter(i => i !== line);
    saveCart(cart); render();
  });

  const form = document.getElementById("checkoutForm");
  const rules = {
    name: v => v.trim().split(/\s+/).filter(w => w.length > 1).length < 2 ? "Enter your full name (first and last name)." : "",
    phone: v => !/^0\d{10}$/.test(v.replace(/\s/g, "")) ? "Enter an 11-digit Nigerian number starting with 0, e.g. 08012345678." : "",
    address: v => v.trim().length < 10 ? "Enter a full delivery address (at least 10 characters)." : ""
  };
  function check(field) {
    const input = form.elements[field], msg = rules[field](input.value);
    document.getElementById(field + "Err").textContent = msg;
    input.classList.toggle("invalid", !!msg);
    return !msg;
  }
  Object.keys(rules).forEach(f => form.elements[f].addEventListener("input", () => check(f)));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean);
    const cart = loadCart();
    if (!ok || !cart.length) return;
    const name = form.elements.name.value.trim(), phone = form.elements.phone.value.replace(/\s/g, ""), address = form.elements.address.value.trim();
    let total = 0;
    const lines = cart.map(i => { const p = findProduct(i.id), sub = p.price * i.qty; total += sub; return { text: `${p.name} (Size ${i.size}) x${i.qty} - ${fmt(sub)}`, html: `${esc(p.name)} (Size ${i.size}) × ${i.qty} — <strong>${fmt(sub)}</strong>` }; });
    const msg = `Hello Kicks Lagos, I want to place an order.\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\nOrder:\n${lines.map((l, n) => `${n + 1}. ${l.text}`).join("\n")}\n\nTotal: ${fmt(total)}`;
    const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    saveCart([]);
    content.classList.add("hidden");
    const s = document.getElementById("orderSummary");
    s.classList.remove("hidden");
    s.innerHTML = `<h2>Order ready, ${esc(name.split(" ")[0])}!</h2>
      <p>Send it on WhatsApp to confirm. We'll deliver to <strong>${esc(address)}</strong> and call <strong>${esc(phone)}</strong>.</p>
      <ul>${lines.map(l => `<li>${l.html}</li>`).join("")}</ul>
      <p style="margin:12px 0"><strong>Total: ${fmt(total)}</strong></p>
      <a class="btn" href="${url}" target="_blank" rel="noopener">Open WhatsApp</a> <a class="btn ghost" href="index.html">Back to shop</a>`;
    window.open(url, "_blank", "noopener");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  render();
}

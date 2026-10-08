document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid"), noRes = document.getElementById("noResults");
  const state = { cat: "all", q: "", sort: "featured" };

  function visible() {
    let list = products.filter(p => (state.cat === "all" || p.category === state.cat) &&
      (p.name + " " + p.brand).toLowerCase().includes(state.q.trim().toLowerCase()));
    if (state.sort === "low") list.sort((a, b) => a.price - b.price);
    if (state.sort === "high") list.sort((a, b) => b.price - a.price);
    if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }
  function render() {
    const list = visible();
    noRes.classList.toggle("hidden", list.length > 0);
    grid.innerHTML = list.map(p => `<article class="card ${p.inStock ? "" : "sold"}">
      ${thumbHTML(p, p.inStock ? "" : '<span class="tag">Sold out</span>')}
      <div class="card-body"><h3>${esc(p.name)}</h3><span class="brand">${esc(p.brand)} · ${esc(p.category)}</span>
      <div class="price">${fmt(p.price)}</div>
      <button class="btn" data-id="${p.id}" ${p.inStock ? "" : "disabled"}>${p.inStock ? "View" : "Sold out"}</button></div></article>`).join("");
  }
  document.getElementById("search").addEventListener("input", e => { state.q = e.target.value; render(); });
  document.getElementById("sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  document.getElementById("filters").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.cat = b.dataset.cat;
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === b));
    render();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    state.cat = "all"; state.q = ""; document.getElementById("search").value = "";
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.cat === "all"));
    render();
  });

  /* modal */
  const overlay = document.getElementById("overlay"), box = document.getElementById("modalBox");
  let current = null, size = null, qty = 1;
  function open(id) {
    current = findProduct(id); size = null; qty = 1;
    box.innerHTML = `<button class="close" id="closeBtn" aria-label="Close">✕</button>${thumbHTML(current)}
      <div class="modal-body"><h2>${esc(current.name)}</h2><span class="brand">${esc(current.brand)}</span>
      <div class="price">${fmt(current.price)}</div><p>${esc(current.description)}</p>
      <span class="field-label">Select size</span>
      <div class="sizes">${current.sizes.map(s => `<button class="size" data-size="${s}">${s}</button>`).join("")}</div>
      <div class="err" id="sizeErr"></div>
      <span class="field-label">Quantity</span>
      <div class="qty"><button id="qMinus" aria-label="Decrease">−</button><span id="qVal">1</span><button id="qPlus" aria-label="Increase">+</button></div>
      <button class="btn" id="addBtn">Add to Cart</button></div>`;
    overlay.classList.add("open");
    document.getElementById("closeBtn").focus();
  }
  const close = () => overlay.classList.remove("open");
  grid.addEventListener("click", e => { const b = e.target.closest("button[data-id]"); if (b && !b.disabled) open(+b.dataset.id); });
  overlay.addEventListener("click", e => {
    if (e.target === overlay || e.target.id === "closeBtn") return close();
    const s = e.target.closest(".size");
    if (s) { size = +s.dataset.size; box.querySelectorAll(".size").forEach(x => x.classList.toggle("active", x === s)); document.getElementById("sizeErr").textContent = ""; }
    if (e.target.id === "qMinus") qty = Math.max(1, qty - 1);
    if (e.target.id === "qPlus") qty = Math.min(5, qty + 1);
    if (e.target.id === "qMinus" || e.target.id === "qPlus") document.getElementById("qVal").textContent = qty;
    if (e.target.id === "addBtn") {
      if (!size) { document.getElementById("sizeErr").textContent = "Please select a size before adding to cart."; return; }
      addToCart(current.id, size, qty); close(); toast(`${current.name} (size ${size}) added to cart`);
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  render();
});

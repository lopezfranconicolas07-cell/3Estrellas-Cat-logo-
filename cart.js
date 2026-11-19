/* 3Estrellas - carrito y pedidos por WhatsApp
   Se agrega sin reemplazar el catálogo ni la conexión actual con Supabase.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "3e_cart_v1";
  let cart = loadCart();
  let whatsappNumber = "";

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (_) {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function moneyNumber(value) {
    // Formatos argentinos habituales: "$29.990" o "$29,990".
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency: "ARS", maximumFractionDigits: 0
    }).format(value || 0);
  }

  function getProductFromCard(card) {
    const name = cleanText(card.querySelector(".name")?.textContent);
    const category = cleanText(card.querySelector(".cat")?.textContent);
    const installmentText = cleanText(card.querySelector(".price:not(.transfer)")?.textContent);
    const transferText = cleanText(card.querySelector(".transfer")?.textContent)
      .replace(/por transferencia/i, "").trim();
    const size = cleanText(card.querySelector(".size")?.textContent).replace(/^talle:\s*/i, "");
    const image = card.querySelector(".photo img")?.getAttribute("src") || "";
    const oldLink = card.querySelector('a[href*="wa.me"]');
    if (!whatsappNumber && oldLink) {
      const match = oldLink.href.match(/wa\.me\/(\d+)/);
      if (match) whatsappNumber = match[1];
    }
    return {
      id: [name, size, transferText].join("|").toLowerCase(),
      name, category, installmentText, transferText, size, image,
      transferPrice: moneyNumber(transferText)
    };
  }

  function addButtonToCard(card) {
    if (!card || card.dataset.cartReady === "1") return;
    const oldLink = card.querySelector('a[href*="wa.me"]');
    if (!oldLink) return; // Los productos sin stock no tienen botón.
    const product = getProductFromCard(card);
    if (!product.name) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "buy threee-add";
    button.textContent = "Agregar al carrito";
    button.setAttribute("data-product-id", product.id);
    oldLink.replaceWith(button);
    card.dataset.cartReady = "1";
  }

  function scanProducts(root = document) {
    root.querySelectorAll(".product").forEach(addButtonToCard);
  }

  function totalItems() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartBadge() {
    const badge = document.querySelector("#threee-cart-count");
    if (badge) badge.textContent = totalItems();
  }

  function addProduct(card) {
    const product = getProductFromCard(card);
    if (!product.name) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    saveCart();
    renderCart();
    openCart();
  }

  function changeQuantity(id, delta) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id);
    saveCart();
    renderCart();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function createInterface() {
    if (document.querySelector("#threee-cart-button")) return;

    const style = document.createElement("style");
    style.textContent = `
      #threee-cart-button{position:fixed;right:16px;bottom:18px;z-index:9998;background:#8b5cf6;color:#fff;border:0;border-radius:999px;padding:14px 18px;font-weight:800;box-shadow:0 8px 28px #0007;cursor:pointer}
      #threee-cart-count{display:inline-flex;min-width:22px;height:22px;align-items:center;justify-content:center;border-radius:50%;background:#fff;color:#24143b;margin-left:7px;font-size:12px}
      #threee-cart-overlay{position:fixed;inset:0;background:#0009;z-index:9999;display:none;align-items:flex-end;justify-content:center;padding:12px}
      #threee-cart-overlay.open{display:flex}
      #threee-cart-panel{background:#17131c;color:#f5f3f7;border:1px solid #3a3045;border-radius:20px 20px 14px 14px;width:min(100%,620px);max-height:92vh;overflow:auto;padding:20px;font-family:Arial,sans-serif;box-shadow:0 20px 70px #0009}
      #threee-cart-panel h2{margin:0 0 5px;font-size:23px}
      #threee-cart-panel .threee-muted{color:#aaa2b2;font-size:13px}
      #threee-cart-panel .threee-line{display:flex;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid #342b3d}
      #threee-cart-panel .threee-line img{width:64px;height:76px;object-fit:cover;border-radius:9px;background:#29222f}
      #threee-cart-panel .threee-details{flex:1;min-width:0}
      #threee-cart-panel .threee-details strong{display:block;margin-bottom:4px}
      #threee-cart-panel .threee-qty{display:flex;align-items:center;gap:10px;margin-top:8px}
      #threee-cart-panel .threee-qty button{padding:5px 11px;border-radius:8px;background:#29222f;color:#fff;border:1px solid #51445e}
      #threee-cart-panel .threee-field{display:block;margin-top:12px;font-size:13px;color:#ddd}
      #threee-cart-panel input,#threee-cart-panel select,#threee-cart-panel textarea{display:block;width:100%;margin-top:5px;padding:12px;border-radius:9px;border:1px solid #51445e;background:#0f0c13;color:#fff;font:inherit}
      #threee-cart-panel textarea{min-height:70px;resize:vertical}
      #threee-cart-panel .threee-actions{display:flex;gap:9px;margin-top:16px}
      #threee-cart-panel .threee-actions button{flex:1;padding:13px;border-radius:10px;border:0;font-weight:800;cursor:pointer}
      #threee-cart-panel .threee-primary{background:#8b5cf6;color:white}
      #threee-cart-panel .threee-secondary{background:#29222f;color:white;border:1px solid #51445e!important}
      #threee-cart-panel .threee-total{display:flex;justify-content:space-between;gap:12px;padding:14px 0;font-weight:800}
      #threee-cart-panel .threee-empty{padding:28px 4px;text-align:center;color:#aaa2b2}
      @media(min-width:600px){#threee-cart-overlay{align-items:center}#threee-cart-panel{border-radius:18px}}
    `;
    document.head.appendChild(style);

    const button = document.createElement("button");
    button.id = "threee-cart-button";
    button.type = "button";
    button.innerHTML = 'Mi carrito <span id="threee-cart-count">0</span>';
    button.addEventListener("click", openCart);
    document.body.appendChild(button);

    const overlay = document.createElement("div");
    overlay.id = "threee-cart-overlay";
    overlay.innerHTML = `
      <section id="threee-cart-panel" role="dialog" aria-modal="true" aria-labelledby="threee-cart-title">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <div><h2 id="threee-cart-title">Tu pedido 3Estrellas</h2><div class="threee-muted">Revisá tus productos y completá tus datos.</div></div>
          <button type="button" id="threee-close" class="threee-secondary" style="padding:9px 12px;border-radius:9px">Cerrar</button>
        </div>
        <div id="threee-cart-items"></div>
        <div id="threee-cart-summary"></div>
        <form id="threee-checkout">
          <h3 style="margin:18px 0 4px">Datos para coordinar la entrega</h3>
          <label class="threee-field">Nombre y apellido *<input name="customerName" required autocomplete="name"></label>
          <label class="threee-field">Tu WhatsApp *<input name="customerPhone" required type="tel" autocomplete="tel" placeholder="Ej. 261 123 4567"></label>
          <label class="threee-field">Localidad *<input name="city" required placeholder="Ej. La Paz, Mendoza"></label>
          <label class="threee-field">Entrega
            <select name="delivery" required>
              <option value="">Elegí una opción</option>
              <option>Coordinar retiro</option>
              <option>Envío a domicilio</option>
              <option>Coordinar punto de encuentro</option>
            </select>
          </label>
          <label class="threee-field">Dirección (si corresponde)<input name="address" autocomplete="street-address"></label>
          <label class="threee-field">Forma de pago *
            <select name="payment" required>
              <option value="">Elegí cómo querés pagar</option>
              <option value="Mercado Pago - link de pago (3 cuotas sin interés)">Mercado Pago - link de pago (3 cuotas sin interés)</option>
              <option value="Transferencia bancaria (20% OFF / precio publicado)">Transferencia bancaria (20% OFF / precio publicado)</option>
              <option value="Efectivo (20% OFF / precio publicado)">Efectivo (20% OFF / precio publicado)</option>
            </select>
          </label>
          <label class="threee-field">Observaciones<textarea name="notes" placeholder="Talles, horarios u otra información..."></textarea></label>
          <div class="threee-actions">
            <button type="button" id="threee-continue" class="threee-secondary">Seguir comprando</button>
            <button type="submit" class="threee-primary">Enviar pedido por WhatsApp</button>
          </div>
          <p class="threee-muted" style="line-height:1.45">El pedido no se cobra en esta página. 3Estrellas confirmará disponibilidad y te enviará el link de pago o los datos para transferir.</p>
        </form>
      </section>`;
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeCart();
    });
    document.body.appendChild(overlay);
    document.querySelector("#threee-close").addEventListener("click", closeCart);
    document.querySelector("#threee-continue").addEventListener("click", closeCart);
    document.querySelector("#threee-checkout").addEventListener("submit", submitOrder);
    updateCartBadge();
    renderCart();
  }

  function openCart() {
    document.querySelector("#threee-cart-overlay")?.classList.add("open");
    renderCart();
  }

  function closeCart() {
    document.querySelector("#threee-cart-overlay")?.classList.remove("open");
  }

  function renderCart() {
    const itemsEl = document.querySelector("#threee-cart-items");
    const summaryEl = document.querySelector("#threee-cart-summary");
    if (!itemsEl || !summaryEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = '<div class="threee-empty">Tu carrito está vacío.<br>Agregá prendas del catálogo para armar tu pedido.</div>';
      summaryEl.innerHTML = "";
      return;
    }

    itemsEl.innerHTML = cart.map(item => `
      <div class="threee-line">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : ""}
        <div class="threee-details">
          <strong>${escapeHtml(item.name)}</strong>
          <div class="threee-muted">${escapeHtml(item.size)} · ${escapeHtml(item.installmentText)}</div>
          <div class="threee-muted">Transferencia: ${escapeHtml(item.transferText)}</div>
          <div class="threee-qty">
            <button type="button" data-cart-action="minus" data-id="${escapeHtml(item.id)}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-action="plus" data-id="${escapeHtml(item.id)}">+</button>
            <button type="button" data-cart-action="remove" data-id="${escapeHtml(item.id)}" style="margin-left:auto">Quitar</button>
          </div>
        </div>
      </div>`).join("");

    const transferTotal = cart.reduce((sum, item) => sum + item.transferPrice * item.quantity, 0);
    summaryEl.innerHTML = `
      <div class="threee-total"><span>Total por transferencia/efectivo</span><span>${formatMoney(transferTotal)}</span></div>
      <div class="threee-muted">El importe de Mercado Pago se confirma al preparar el link de pago. Los precios de transferencia mostrados son los publicados en el catálogo.</div>`;

    itemsEl.querySelectorAll("[data-cart-action]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const action = button.dataset.cartAction;
        if (action === "plus") changeQuantity(id, 1);
        if (action === "minus") changeQuantity(id, -1);
        if (action === "remove") {
          cart = cart.filter(item => item.id !== id);
          saveCart();
          renderCart();
        }
      });
    });
  }

  function submitOrder(event) {
    event.preventDefault();
    if (!cart.length) {
      alert("Tu carrito está vacío.");
      return;
    }
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const transferTotal = cart.reduce((sum, item) => sum + item.transferPrice * item.quantity, 0);
    const lines = cart.map(item =>
      `• ${item.quantity} x ${item.name} | Talle: ${item.size}\n  ${item.installmentText}\n  Transferencia: ${item.transferText}`
    ).join("\n");

    const message = [
      "¡Hola 3Estrellas! Quiero realizar este pedido:",
      "",
      lines,
      "",
      `TOTAL por transferencia/efectivo: ${formatMoney(transferTotal)}`,
      "",
      "DATOS DEL CLIENTE",
      `Nombre: ${data.get("customerName")}`,
      `WhatsApp: ${data.get("customerPhone")}`,
      `Localidad: ${data.get("city")}`,
      `Entrega: ${data.get("delivery")}`,
      `Dirección: ${data.get("address") || "A coordinar"}`,
      `Forma de pago: ${data.get("payment")}`,
      `Observaciones: ${data.get("notes") || "Sin observaciones"}`,
      "",
      "Entiendo que el pedido queda pendiente de confirmación y pago."
    ].join("\n");

    // Se recupera el número de WhatsApp del enlace original del catálogo.
    if (!whatsappNumber) {
      const existing = document.querySelector('.product a[href*="wa.me"]');
      const match = existing?.href.match(/wa\.me\/(\d+)/);
      if (match) whatsappNumber = match[1];
    }
    if (!whatsappNumber) {
      alert("No pude identificar el WhatsApp de la tienda. El pedido no se envió. Contactanos desde el botón de WhatsApp del catálogo.");
      return;
    }

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    cart = [];
    saveCart();
    renderCart();
    form.reset();
    closeCart();
  }

  function start() {
    createInterface();
    scanProducts();
    document.addEventListener("click", event => {
      const addButton = event.target.closest(".threee-add");
      if (!addButton) return;
      const card = addButton.closest(".product");
      if (card) addProduct(card);
    });
    const catalog = document.querySelector("#catalog");
    if (catalog) {
      new MutationObserver(() => scanProducts(catalog)).observe(catalog, {
        childList: true, subtree: true
      });
    }
    // También vuelve a transformar tarjetas después de que Supabase cargue.
    setTimeout(() => scanProducts(), 300);
    updateCartBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

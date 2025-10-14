/* Cell Shop SPA - Vanilla JS */

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const PRODUCTS = [
  {
    id: 'iphone-15',
    name: 'Apple iPhone 15',
    brand: 'Apple',
    price: 899,
    rating: 4.7,
    storage: '128 GB',
    colors: ['Black', 'Blue', 'Yellow'],
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=60',
    description: 'The latest iPhone delivers blazing performance and an advanced dual‑camera system.'
  },
  {
    id: 'iphone-15-pro',
    name: 'Apple iPhone 15 Pro',
    brand: 'Apple',
    price: 1099,
    rating: 4.8,
    storage: '256 GB',
    colors: ['Black Titanium', 'White Titanium'],
    image: 'https://images.unsplash.com/photo-1603899122433-7f2b5f9910d6?auto=format&fit=crop&w=1200&q=60',
    description: 'Titanium design, A17 Pro chip, pro camera system, and USB‑C.'
  },
  {
    id: 'galaxy-s24',
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    price: 799,
    rating: 4.6,
    storage: '128 GB',
    colors: ['Graphite', 'Violet'],
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=60',
    description: 'Dynamic AMOLED, powerful performance, and a versatile triple‑camera setup.'
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    price: 1199,
    rating: 4.9,
    storage: '256 GB',
    colors: ['Gray', 'Green'],
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=60',
    description: 'Ultimate Samsung flagship with pro‑grade camera and S‑Pen support.'
  },
  {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    brand: 'Google',
    price: 699,
    rating: 4.5,
    storage: '128 GB',
    colors: ['Obsidian', 'Hazel'],
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=60',
    description: 'Pixel camera magic and the latest AI‑powered features from Google.'
  },
  {
    id: 'pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    brand: 'Google',
    price: 999,
    rating: 4.7,
    storage: '256 GB',
    colors: ['Obsidian', 'Porcelain'],
    image: 'https://images.unsplash.com/photo-1605451938341-10270899f3a0?auto=format&fit=crop&w=1200&q=60',
    description: 'Pro camera system and Tensor power for performance and security.'
  },
  {
    id: 'oneplus-12',
    name: 'OnePlus 12',
    brand: 'OnePlus',
    price: 749,
    rating: 4.4,
    storage: '256 GB',
    colors: ['Emerald', 'Black'],
    image: 'https://images.unsplash.com/photo-1601556424809-6853a31cbcf3?auto=format&fit=crop&w=1200&q=60',
    description: 'Flagship killer with fast charging and smooth performance.'
  },
  {
    id: 'xiaomi-14',
    name: 'Xiaomi 14',
    brand: 'Xiaomi',
    price: 699,
    rating: 4.3,
    storage: '256 GB',
    colors: ['Black', 'White'],
    image: 'https://images.unsplash.com/photo-1610725664343-6d1b3da8932e?auto=format&fit=crop&w=1200&q=60',
    description: 'Great value flagship with premium design and cameras.'
  },
  {
    id: 'moto-edge-50',
    name: 'Motorola Edge 50',
    brand: 'Motorola',
    price: 599,
    rating: 4.1,
    storage: '128 GB',
    colors: ['Blue', 'Forest'],
    image: 'https://images.unsplash.com/photo-1557180295-76eee20ae8aa?auto=format&fit=crop&w=1200&q=60',
    description: 'Clean Android experience with a long‑lasting battery.'
  },
  {
    id: 'nothing-2a',
    name: 'Nothing Phone (2a)',
    brand: 'Nothing',
    price: 499,
    rating: 4.2,
    storage: '128 GB',
    colors: ['Black', 'White'],
    image: 'https://images.unsplash.com/photo-1658355410354-ec71d04413cb?auto=format&fit=crop&w=1200&q=60',
    description: 'Unique transparent design with solid performance and cameras.'
  },
  {
    id: 'xperia-1v',
    name: 'Sony Xperia 1 V',
    brand: 'Sony',
    price: 1299,
    rating: 4.3,
    storage: '256 GB',
    colors: ['Black', 'Platinum'],
    image: 'https://images.unsplash.com/photo-1582560487631-6da534ca2bca?auto=format&fit=crop&w=1200&q=60',
    description: 'Cine‑grade display and pro camera controls for creators.'
  },
  {
    id: 'rog-phone-8',
    name: 'ASUS ROG Phone 8',
    brand: 'ASUS',
    price: 999,
    rating: 4.6,
    storage: '256 GB',
    colors: ['Phantom Black'],
    image: 'https://images.unsplash.com/photo-1557180295-611e4f3b0f7c?auto=format&fit=crop&w=1200&q=60',
    description: 'Gaming beast with high refresh display and advanced cooling.'
  }
];

const state = {
  cart: loadCart(),
  modalProductId: null,
  filters: {
    search: '',
    brand: '',
    maxPrice: Math.max(...PRODUCTS.map(p => p.price)),
  },
};

const els = {
  productGrid: document.getElementById('productGrid'),
  searchInput: document.getElementById('searchInput'),
  brandFilter: document.getElementById('brandFilter'),
  priceRange: document.getElementById('priceRange'),
  priceRangeValue: document.getElementById('priceRangeValue'),
  cartButton: document.getElementById('cartButton'),
  cartDrawer: document.getElementById('cartDrawer'),
  drawerOverlay: document.getElementById('drawerOverlay'),
  closeCart: document.getElementById('closeCart'),
  cartItems: document.getElementById('cartItems'),
  cartCount: document.getElementById('cartCount'),
  cartSubtotal: document.getElementById('cartSubtotal'),
  clearCart: document.getElementById('clearCart'),
  goToCheckout: document.getElementById('goToCheckout'),
  catalogView: document.getElementById('catalog-view'),
  checkoutView: document.getElementById('checkout-view'),
  checkoutForm: document.getElementById('checkoutForm'),
  checkoutMessage: document.getElementById('checkoutMessage'),
  summaryItems: document.getElementById('summaryItems'),
  summarySubtotal: document.getElementById('summarySubtotal'),
  summaryShipping: document.getElementById('summaryShipping'),
  summaryTotal: document.getElementById('summaryTotal'),
  // Modal
  productModal: document.getElementById('productModal'),
  modalOverlay: document.getElementById('modalOverlay'),
  closeModal: document.getElementById('closeModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  modalAddToCart: document.getElementById('modalAddToCart'),
  // Template
  productCardTemplate: document.getElementById('productCardTemplate'),
};

function loadCart() {
  try {
    const raw = localStorage.getItem('cellshop_cart_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(it => typeof it?.productId === 'string' && Number.isFinite(it?.qty));
  } catch (_) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('cellshop_cart_v1', JSON.stringify(state.cart));
}

function findProduct(productId) {
  return PRODUCTS.find(p => p.id === productId);
}

function formatCurrency(value) {
  return CURRENCY.format(value);
}

function computeCartTotals() {
  let subtotal = 0;
  for (const item of state.cart) {
    const product = findProduct(item.productId);
    if (!product) continue;
    subtotal += product.price * item.qty;
  }
  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function setCartOpen(isOpen) {
  if (isOpen) {
    els.cartDrawer.classList.add('open');
    els.cartDrawer.setAttribute('aria-hidden', 'false');
  } else {
    els.cartDrawer.classList.remove('open');
    els.cartDrawer.setAttribute('aria-hidden', 'true');
  }
}

function renderCart() {
  els.cartItems.innerHTML = '';
  if (state.cart.length === 0) {
    els.cartItems.innerHTML = '<div class="empty">Your cart is empty.</div>';
  } else {
    for (const item of state.cart) {
      const product = findProduct(item.productId);
      if (!product) continue;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${product.image}" alt="${product.name}" />
        <div>
          <div class="title">${product.name}</div>
          <div class="price">${formatCurrency(product.price)}</div>
          <div class="qty-controls">
            <button class="icon-button" data-action="dec" aria-label="Decrease quantity">−</button>
            <input type="number" min="1" value="${item.qty}" aria-label="Quantity" />
            <button class="icon-button" data-action="inc" aria-label="Increase quantity">+</button>
            <button class="remove-item" aria-label="Remove">Remove</button>
          </div>
        </div>
        <div>${formatCurrency(product.price * item.qty)}</div>
      `;
      const qtyInput = row.querySelector('input[type="number"]');
      const incBtn = row.querySelector('[data-action="inc"]');
      const decBtn = row.querySelector('[data-action="dec"]');
      const removeBtn = row.querySelector('.remove-item');

      incBtn.addEventListener('click', () => updateCartQty(item.productId, item.qty + 1));
      decBtn.addEventListener('click', () => updateCartQty(item.productId, Math.max(1, item.qty - 1)));
      qtyInput.addEventListener('change', () => {
        const v = parseInt(qtyInput.value, 10);
        if (Number.isFinite(v) && v > 0) updateCartQty(item.productId, v);
        else qtyInput.value = String(item.qty);
      });
      removeBtn.addEventListener('click', () => removeFromCart(item.productId));

      els.cartItems.appendChild(row);
    }
  }
  const totals = computeCartTotals();
  els.cartSubtotal.textContent = formatCurrency(totals.subtotal);
  els.cartCount.textContent = String(state.cart.reduce((a, it) => a + it.qty, 0));
}

function addToCart(productId, qty = 1) {
  const existing = state.cart.find(it => it.productId === productId);
  if (existing) existing.qty += qty;
  else state.cart.push({ productId, qty });
  saveCart();
  renderCart();
}

function updateCartQty(productId, qty) {
  const existing = state.cart.find(it => it.productId === productId);
  if (!existing) return;
  existing.qty = qty;
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(it => it.productId !== productId);
  saveCart();
  renderCart();
}

function clearCart() {
  state.cart = [];
  saveCart();
  renderCart();
}

function starRating(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  if (half) s += '☆';
  while (s.length < 5) s += '☆';
  return s + ` (${rating.toFixed(1)})`;
}

function renderProducts() {
  const search = state.filters.search.trim().toLowerCase();
  const brand = state.filters.brand;
  const maxPrice = state.filters.maxPrice;

  const list = PRODUCTS.filter(p => {
    if (brand && p.brand !== brand) return false;
    if (p.price > maxPrice) return false;
    if (search) {
      const hay = `${p.name} ${p.brand} ${p.storage}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  els.productGrid.innerHTML = '';
  if (list.length === 0) {
    els.productGrid.innerHTML = '<div class="empty" style="grid-column: 1/-1">No products match your filters.</div>';
    return;
  }

  for (const p of list) {
    const card = els.productCardTemplate.content.firstElementChild.cloneNode(true);
    const img = card.querySelector('.product-image');
    img.src = p.image;
    img.alt = p.name;
    card.querySelector('.product-title').textContent = p.name;
    card.querySelector('.product-brand').textContent = p.brand;
    card.querySelector('.product-rating').textContent = starRating(p.rating);
    card.querySelector('.product-price').textContent = formatCurrency(p.price);

    const quickBtn = card.querySelector('.quick-view');
    quickBtn.addEventListener('click', () => openProductModal(p.id));
    const addBtn = card.querySelector('.add-to-cart');
    addBtn.addEventListener('click', () => addToCart(p.id));

    els.productGrid.appendChild(card);
  }
}

function openProductModal(productId) {
  const p = findProduct(productId);
  if (!p) return;
  state.modalProductId = productId;
  els.modalTitle.textContent = p.name;
  els.modalBody.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; align-items:start;">
      <img src="${p.image}" alt="${p.name}" style="width:100%; border-radius: .75rem;" />
      <div style="display:grid; gap:.5rem;">
        <div><strong>Brand:</strong> ${p.brand}</div>
        <div><strong>Price:</strong> ${formatCurrency(p.price)}</div>
        <div><strong>Storage:</strong> ${p.storage}</div>
        <div><strong>Rating:</strong> ${starRating(p.rating)}</div>
        <p style="margin:.5rem 0 0; color: var(--text-2);">${p.description}</p>
      </div>
    </div>
  `;
  els.productModal.classList.add('open');
  els.productModal.setAttribute('aria-hidden', 'false');
}

function closeProductModal() {
  state.modalProductId = null;
  els.productModal.classList.remove('open');
  els.productModal.setAttribute('aria-hidden', 'true');
}

function updateFiltersUI() {
  els.priceRange.value = String(state.filters.maxPrice);
  els.priceRangeValue.textContent = formatCurrency(state.filters.maxPrice);
  els.searchInput.value = state.filters.search;
  els.brandFilter.value = state.filters.brand;
}

function applyBrandOptions() {
  const brands = Array.from(new Set(PRODUCTS.map(p => p.brand))).sort();
  for (const b of brands) {
    const opt = document.createElement('option');
    opt.value = b; opt.textContent = b; els.brandFilter.appendChild(opt);
  }
}

function initPriceRange() {
  const max = Math.ceil(Math.max(...PRODUCTS.map(p => p.price)) / 50) * 50;
  els.priceRange.max = String(max);
  state.filters.maxPrice = max;
}

function updateRoute() {
  const hash = location.hash || '#/';
  const isCheckout = hash.startsWith('#/checkout');
  if (isCheckout) {
    els.catalogView.hidden = true;
    els.checkoutView.hidden = false;
    setCartOpen(false);
    renderCheckoutSummary();
  } else {
    els.catalogView.hidden = false;
    els.checkoutView.hidden = true;
  }
}

function renderCheckoutSummary() {
  els.summaryItems.innerHTML = '';
  if (state.cart.length === 0) {
    els.summaryItems.innerHTML = '<div class="empty">Cart is empty.</div>';
  } else {
    for (const item of state.cart) {
      const p = findProduct(item.productId);
      if (!p) continue;
      const row = document.createElement('div');
      row.className = 'summary-row';
      row.innerHTML = `<span>${p.name} × ${item.qty}</span><span>${formatCurrency(p.price * item.qty)}</span>`;
      els.summaryItems.appendChild(row);
    }
  }
  const totals = computeCartTotals();
  els.summarySubtotal.textContent = formatCurrency(totals.subtotal);
  els.summaryShipping.textContent = formatCurrency(totals.shipping);
  els.summaryTotal.textContent = formatCurrency(totals.total);
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function bindEvents() {
  // Filters
  els.searchInput.addEventListener('input', debounce(() => {
    state.filters.search = els.searchInput.value;
    renderProducts();
  }, 200));
  els.brandFilter.addEventListener('change', () => {
    state.filters.brand = els.brandFilter.value;
    renderProducts();
  });
  els.priceRange.addEventListener('input', () => {
    state.filters.maxPrice = parseInt(els.priceRange.value, 10);
    els.priceRangeValue.textContent = formatCurrency(state.filters.maxPrice);
    renderProducts();
  });

  // Cart drawer
  els.cartButton.addEventListener('click', () => setCartOpen(true));
  els.closeCart.addEventListener('click', () => setCartOpen(false));
  els.drawerOverlay.addEventListener('click', () => setCartOpen(false));
  els.clearCart.addEventListener('click', () => clearCart());
  els.goToCheckout.addEventListener('click', () => setCartOpen(false));

  // Modal
  els.closeModal.addEventListener('click', closeProductModal);
  els.modalOverlay.addEventListener('click', closeProductModal);
  els.modalAddToCart.addEventListener('click', () => {
    if (state.modalProductId) addToCart(state.modalProductId);
    closeProductModal();
    setCartOpen(true);
  });

  // Routing
  window.addEventListener('hashchange', updateRoute);

  // Checkout form
  els.checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!els.checkoutForm.reportValidity()) return;
    if (state.cart.length === 0) { alert('Cart is empty.'); return; }

    // Simulate order placement
    clearCart();
    els.checkoutMessage.hidden = false;
    setTimeout(() => {
      els.checkoutMessage.hidden = true;
      location.hash = '#/';
    }, 1500);
  });
}

function init() {
  applyBrandOptions();
  initPriceRange();
  updateFiltersUI();
  renderProducts();
  renderCart();
  updateRoute();
  bindEvents();
}

// Initialize after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

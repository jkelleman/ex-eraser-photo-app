// Front end for the print demo. Four steps: photos, store, details, done.
// Focus moves to each step's heading so screen reader users hear where they are.

const DEMO_LOCATION = { latitude: 42.3601, longitude: -71.0589 }; // Boston
const MAX_QTY = 20;

const state = {
  photos: [],
  products: [],
  selected: new Map(), // photo id -> qty
  productId: null,
  stores: [],
  store: null,
  orderId: null,
};

const $ = (id) => document.getElementById(id);

// Escapes text from the server or Walgreens before it goes into markup.
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Set when there's no server: the page answers its own API calls with demo
// data (see local-api.js), so it works from a plain hosted link.
let localApi = null;

async function connect() {
  try {
    const response = await fetch('api/config');
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      return await response.json();
    }
  } catch {
    // No server. Fall through to browser-only mode.
  }
  const { createLocalApi } = await import('./local-api.js');
  localApi = createLocalApi();
  return localApi('api/config');
}

async function api(path, options = {}) {
  if (localApi) return localApi(path, options);
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.details = data.errors;
    throw error;
  }
  return data;
}

function showStep(name) {
  for (const section of document.querySelectorAll('.step')) {
    section.hidden = section.id !== `step-${name}`;
  }
  for (const item of document.querySelectorAll('[data-step-indicator]')) {
    if (item.dataset.stepIndicator === name) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
  const heading = $(`${name}-heading`);
  heading.focus();
  document.title = `${heading.textContent} · Ex-Eraser Photo App print demo`;
}

function selectedProduct() {
  return state.products.find((p) => p.productId === state.productId);
}

function cartItems() {
  return [...state.selected.entries()].map(([id, qty]) => ({ id, qty }));
}

function totalPrints() {
  return cartItems().reduce((sum, item) => sum + item.qty, 0);
}

// Step 1: photos and size

function renderSizes() {
  const container = $('sizes');
  container.innerHTML = '';
  state.products.forEach((product, index) => {
    const id = `size-${product.productId}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'option';
    wrapper.innerHTML = `
      <input type="radio" name="size" id="${esc(id)}" value="${esc(product.productId)}" ${index === 0 ? 'checked' : ''}>
      <label for="${esc(id)}">${esc(product.productSize)} · $${Number(product.productPrice).toFixed(2)} each</label>`;
    container.append(wrapper);
  });
  state.productId = state.products[0]?.productId || null;
}

$('sizes').addEventListener('change', (event) => {
  state.productId = event.target.value;
});

function renderPhotos() {
  const grid = $('photo-grid');
  grid.innerHTML = '';
  const printable = state.photos.filter((photo) => photo.printable);

  printable.forEach((photo, index) => {
    const checkboxId = `photo-${photo.id}`;
    const qtyId = `qty-${photo.id}`;
    const item = document.createElement('li');
    item.className = 'photo-card';
    item.innerHTML = `
      <img src="photos/${esc(photo.file)}" alt="${esc(photo.title)}, ${esc(photo.date)}. ${esc(photo.mode)}.">
      <div class="photo-body">
        <p class="photo-title">${esc(photo.title)}</p>
        <p class="photo-meta">${esc(photo.date)}</p>
        <span class="mode-chip">${esc(photo.mode)}</span>
        <div class="photo-select">
          <input type="checkbox" id="${checkboxId}" aria-describedby="${checkboxId}-pos">
          <label for="${checkboxId}">Print this photo</label>
          <span id="${checkboxId}-pos" hidden>Photo ${index + 1} of ${printable.length}</span>
        </div>
        <div class="qty" hidden>
          <label for="${qtyId}">Copies</label>
          <input type="number" id="${qtyId}" min="1" max="${MAX_QTY}" value="1" inputmode="numeric">
        </div>
      </div>`;

    const checkbox = item.querySelector('input[type="checkbox"]');
    const qtyRow = item.querySelector('.qty');
    const qtyInput = item.querySelector('input[type="number"]');

    checkbox.addEventListener('change', () => {
      $('photos-error').textContent = '';
      qtyRow.hidden = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);
      if (checkbox.checked) state.selected.set(photo.id, Number(qtyInput.value) || 1);
      else state.selected.delete(photo.id);
    });
    qtyInput.addEventListener('change', () => {
      const qty = Math.min(MAX_QTY, Math.max(1, Math.round(Number(qtyInput.value) || 1)));
      qtyInput.value = qty;
      if (checkbox.checked) state.selected.set(photo.id, qty);
    });

    grid.append(item);
  });

  const fadedCount = state.photos.length - printable.length;
  $('faded-note').textContent = fadedCount
    ? `${fadedCount} faded ${fadedCount === 1 ? "photo isn't" : "photos aren't"} listed here, since faded photos haven't been edited. You can change them in the vault first.`
    : '';
}

$('photos-next').addEventListener('click', () => {
  $('photos-error').textContent = '';
  if (state.selected.size === 0) {
    $('photos-error').textContent = 'Choose at least one photo to print.';
    return;
  }
  showStep('store');
});

// Step 2: stores

async function findStores(location) {
  $('store-error').textContent = '';
  $('store-status').textContent = 'Finding stores near you…';
  try {
    const { stores } = await api('api/stores', {
      method: 'POST',
      body: {
        ...location,
        items: [{ productId: state.productId, qty: totalPrints() }],
      },
    });
    state.stores = stores;
    renderStores();
    $('store-status').textContent = stores.length
      ? `Found ${stores.length} ${stores.length === 1 ? 'store' : 'stores'}.`
      : "I couldn't find a store that can print this order nearby. Try another location.";
  } catch (error) {
    $('store-status').textContent = '';
    $('store-error').textContent = error.message;
  }
}

function renderStores() {
  const container = $('stores');
  container.innerHTML = '';
  state.store = null;
  state.stores.forEach((store) => {
    const id = `store-${store.storeNum}`;
    const option = document.createElement('div');
    option.className = 'store-option';
    option.innerHTML = `
      <input type="radio" name="store" id="${esc(id)}" value="${esc(store.storeNum)}" aria-describedby="${esc(id)}-details">
      <div>
        <label for="${esc(id)}">${esc(store.street)}, ${esc(store.city)}</label>
        <p class="hint" id="${esc(id)}-details">${esc(store.distance)} ${esc(store.distanceUnit)} away · Ready: ${esc(store.pickupLabel)}</p>
      </div>`;
    container.append(option);
  });
  $('store-fieldset').hidden = state.stores.length === 0;
}

$('stores').addEventListener('change', (event) => {
  state.store = state.stores.find((store) => store.storeNum === event.target.value) || null;
  $('store-error').textContent = '';
});

$('use-demo-location').addEventListener('click', () => findStores(DEMO_LOCATION));

$('use-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    $('store-error').textContent = "This browser can't share your location. You can use the demo location instead.";
    return;
  }
  $('store-status').textContent = 'Asking for your location…';
  navigator.geolocation.getCurrentPosition(
    (position) => findStores({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
    () => {
      $('store-status').textContent = '';
      $('store-error').textContent = "I couldn't get your location. You can use the demo location instead, or try again.";
    },
    { timeout: 10000 },
  );
});

$('store-next').addEventListener('click', () => {
  $('store-error').textContent = '';
  if (!state.store) {
    $('store-error').textContent = 'Choose a store for pickup.';
    return;
  }
  renderSummary();
  showStep('details');
});

// Step 3: details

function renderSummary() {
  const product = selectedProduct();
  const prints = totalPrints();
  const subtotal = product ? prints * Number(product.productPrice) : 0;
  $('summary').innerHTML = `
    <dt>Prints</dt><dd>${prints} × ${esc(product?.productSize)}</dd>
    <dt>Photos</dt><dd>${state.selected.size}</dd>
    <dt>Pickup</dt><dd>${esc(state.store.street)}, ${esc(state.store.city)}</dd>
    <dt>Ready</dt><dd>${esc(state.store.pickupLabel)}</dd>
    <dt>Subtotal</dt><dd>$${subtotal.toFixed(2)}</dd>`;
}

function showFieldErrors(form) {
  let firstInvalid = null;
  for (const input of form.querySelectorAll('input[required]')) {
    const valid = input.type === 'checkbox' ? input.checked : input.checkValidity() && input.value.trim() !== '';
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid && !firstInvalid) firstInvalid = input;
  }
  return firstInvalid;
}

// Clear a field's error state as soon as the person fixes it.
$('details-form').addEventListener('input', (event) => {
  if (event.target.getAttribute('aria-invalid') === 'true') {
    const input = event.target;
    const valid = input.type === 'checkbox' ? input.checked : input.checkValidity() && input.value.trim() !== '';
    if (valid) input.setAttribute('aria-invalid', 'false');
    if (!document.querySelector('#details-form [aria-invalid="true"]')) $('details-error').textContent = '';
  }
});

$('details-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const errorBox = $('details-error');
  errorBox.textContent = '';

  const firstInvalid = showFieldErrors(form);
  if (firstInvalid) {
    errorBox.textContent = firstInvalid.id === 'terms'
      ? 'Please agree to the Walgreens terms to place your order.'
      : 'Please fill in the highlighted fields.';
    firstInvalid.focus();
    return;
  }

  const data = new FormData(form);
  const submit = $('submit-order');
  submit.disabled = true;
  $('details-status').textContent = 'Sending your photos…';

  try {
    const order = await api('api/orders', {
      method: 'POST',
      body: {
        customer: {
          firstName: data.get('firstName').trim(),
          lastName: data.get('lastName').trim(),
          email: data.get('email').trim(),
          phone: data.get('phone').trim(),
        },
        storeNum: state.store.storeNum,
        promiseTime: state.store.promiseTime,
        productId: state.productId,
        photos: cartItems(),
        termsAccepted: data.get('termsAccepted') === 'on',
      },
    });
    state.orderId = order.vendorOrderId;
    $('done-pickup').textContent = `Pick them up at the Walgreens at ${state.store.street}, ${state.store.city}. Ready: ${order.pickupLabel}.`;
    $('done-order').textContent = `Order number ${order.vendorOrderId}. Walgreens will email you when they're ready.`;
    $('details-status').textContent = '';
    $('order-status').textContent = '';
    showStep('done');
  } catch (error) {
    $('details-status').textContent = '';
    if (error.details?.length > 1) {
      errorBox.innerHTML = `<p>Please fix these first:</p><ul>${error.details.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
    } else {
      errorBox.textContent = error.message;
    }
  } finally {
    submit.disabled = false;
  }
});

// Step 4: done

$('check-status').addEventListener('click', async () => {
  $('order-status').textContent = 'Checking…';
  try {
    const status = await api(`api/orders/${encodeURIComponent(state.orderId)}/status`);
    $('order-status').textContent = `Status: ${status.label}.`;
  } catch (error) {
    $('order-status').textContent = error.message;
  }
});

$('start-over').addEventListener('click', () => {
  state.selected.clear();
  state.stores = [];
  state.store = null;
  state.orderId = null;
  $('details-form').reset();
  for (const input of document.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
  for (const id of ['store-status', 'details-error', 'order-status']) $(id).textContent = '';
  $('store-fieldset').hidden = true;
  renderSizes();
  renderPhotos();
  showStep('photos');
});

for (const button of document.querySelectorAll('[data-back]')) {
  button.addEventListener('click', () => showStep(button.dataset.back));
}

// Start

async function init() {
  try {
    const config = await connect();
    const [{ photos }, { products }] = await Promise.all([api('api/photos'), api('api/products')]);
    if (config.mode === 'mock') {
      const banner = $('mode-banner');
      banner.textContent = 'Demo mode: stores and prices are made up, and no real orders are placed.';
      banner.hidden = false;
    }
    // Hosted pages can't ask for location, and demo stores don't depend on it.
    if (localApi) $('use-location').hidden = true;
    state.photos = photos;
    state.products = products;
    renderSizes();
    renderPhotos();
  } catch (error) {
    $('photos-error').textContent = "The demo couldn't load. Check that the server is running, then refresh.";
  }
}

init();

// Front end for the print demo. Four steps: photos, store, details, done.
// Focus moves to each step's heading so screen reader users hear where they are.

const DEMO_LOCATION = { latitude: 42.3601, longitude: -71.0589 }; // Boston
const MAX_QTY = 20;
const STEPS = ['photos', 'store', 'details', 'done'];

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

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const sizeLabel = (size) => `${String(size ?? '').replace('x', '×')} in`;

// "11-23-2026 3:30 PM" -> "Today, 3:30 PM" / "Tomorrow, 9:00 AM" / "Fri, Nov 27, 3:30 PM".
// Walgreens' "no promise time" value is already "Within 48 hours".
function friendlyPickup(label) {
  const match = /^(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2}) (AM|PM)$/.exec(label || '');
  if (!match) return label;
  const [, mm, dd, yyyy, h, min, ampm] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((date - today) / 86400000);
  const time = `${Number(h)}:${min} ${ampm}`;
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`;
}

// Talking to the server, or answering locally when there isn't one.

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

// Steps

function showStep(name) {
  const index = STEPS.indexOf(name);
  for (const section of document.querySelectorAll('.step')) {
    section.hidden = section.id !== `step-${name}`;
  }
  for (const item of document.querySelectorAll('[data-step-indicator]')) {
    const i = STEPS.indexOf(item.dataset.stepIndicator);
    const current = i === index;
    item.toggleAttribute('aria-current', current);
    if (current) item.setAttribute('aria-current', 'step');
    item.classList.toggle('complete', i < index);
    item.querySelector('.step-state').textContent = i < index ? ', completed' : current ? ', current step' : '';
  }
  const heading = $(`${name}-heading`);
  heading.focus();
  window.scrollTo({ top: 0 });
  document.title = `${heading.textContent} · Ex-Eraser Photo App print demo`;
  updateOrder();
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

function subtotal() {
  const product = selectedProduct();
  return product ? totalPrints() * Number(product.productPrice) : 0;
}

// Order summary (sidebar on wide screens, bottom bar on phones)

function updateOrder() {
  const product = selectedProduct();
  const prints = totalPrints();
  const photosById = new Map(state.photos.map((photo) => [photo.id, photo]));

  $('order-thumbs').innerHTML = cartItems()
    .map(({ id, qty }) => {
      const photo = photosById.get(id);
      return `<li title="${esc(photo.title)}: ${esc(treatmentLabel(photo))}"><img src="photos/${esc(photo.file)}" alt=""><span>${qty}</span></li>`;
    })
    .join('');

  const lines = [
    ['Photos', state.selected.size ? String(state.selected.size) : 'None yet'],
    ['Prints', prints ? `${prints} × ${esc(sizeLabel(product?.productSize))}` : 'None yet'],
  ];
  if (state.selected.size) lines.push(['Edits', esc(editsSummary())]);
  if (state.store) {
    lines.push(['Pickup', `${esc(state.store.street)}`]);
    lines.push(['Ready', esc(friendlyPickup(state.store.pickupLabel))]);
  }
  $('order-lines').innerHTML = lines.map(([dt, dd]) => `<dt>${dt}</dt><dd>${dd}</dd>`).join('');
  $('order-subtotal').textContent = money(subtotal());
  $('order-brief').textContent = prints
    ? `${prints} ${prints === 1 ? 'print' : 'prints'}, ${sizeLabel(product?.productSize)}`
    : 'No photos chosen';
}

// Photo credits (the CC BY licenses ask for credit and a note that the photo was changed)

function renderCredits() {
  const seen = new Map();
  for (const photo of state.photos) {
    if (photo.credit && !seen.has(photo.credit.sourceUrl)) seen.set(photo.credit.sourceUrl, photo.credit);
  }
  $('credits-list').innerHTML = [...seen.values()]
    .map((c) => `<li><a href="${esc(c.sourceUrl)}">Photo</a> by ${esc(c.name)}, <a href="${esc(c.licenseUrl)}">${esc(c.license)}</a>. Edited with this app's AI pipeline.</li>`)
    .join('');
}

// Step 1: sizes and photos

function sizeShape(productSize) {
  const [a, b] = String(productSize).split('x').map(Number);
  if (!a || !b) return '';
  const scale = 44 / Math.max(a, b, 10);
  return `<span style="width:${Math.round(b * scale)}px;height:${Math.round(a * scale)}px"></span>`;
}

function renderSizes() {
  $('sizes').innerHTML = state.products
    .map((product, index) => {
      const id = `size-${product.productId}`;
      return `
        <label class="size" for="${esc(id)}">
          <input type="radio" name="size" id="${esc(id)}" value="${esc(product.productId)}" ${index === 0 ? 'checked' : ''}>
          <span class="size-shape" aria-hidden="true">${sizeShape(product.productSize)}</span>
          <span>
            <span class="size-name">${esc(sizeLabel(product.productSize))}</span>
            <span class="size-price">${money(product.productPrice)} each</span>
          </span>
        </label>`;
    })
    .join('');
  state.productId = state.products[0]?.productId || null;
}

$('sizes').addEventListener('change', (event) => {
  state.productId = event.target.value;
  updateOrder();
});

// How each photo was edited, in plain words, with a matching icon.
const ICONS = {
  Erased: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5l5 5-8.5 8.5H6l-2.5-2.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 10l5 5M11 18h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  Cropped: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 002 2h14M2 6h14a2 2 0 012 2v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  Replaced: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function treatmentLabel(photo) {
  if (photo.mode === 'Erased') return 'Erased from photo';
  if (photo.mode === 'Cropped') return 'Cropped out';
  if (photo.mode === 'Replaced') return photo.replacement ? `Replaced with a ${photo.replacement}` : 'Replaced';
  return photo.mode;
}

// "1 erased, 1 replaced" for the chosen photos.
function editsSummary() {
  const photosById = new Map(state.photos.map((photo) => [photo.id, photo]));
  const counts = new Map();
  for (const id of state.selected.keys()) {
    const mode = photosById.get(id)?.mode;
    counts.set(mode, (counts.get(mode) || 0) + 1);
  }
  return [...counts].map(([mode, n]) => `${n} ${String(mode).toLowerCase()}`).join(', ');
}

const CHECK_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderPhotos() {
  const grid = $('photo-grid');
  grid.innerHTML = '';
  const printable = state.photos.filter((photo) => photo.printable);

  printable.forEach((photo, index) => {
    const checkboxId = `photo-${photo.id}`;
    const item = document.createElement('li');
    item.innerHTML = `
      <label class="print-card" for="${esc(checkboxId)}">
        <input type="checkbox" id="${esc(checkboxId)}" aria-label="Print ${esc(photo.title)}" aria-describedby="${esc(checkboxId)}-info">
        <span class="print-frame">
          <img src="photos/${esc(photo.file)}" alt="">
          <span class="before-badge" hidden>Before</span>
          <span class="check" aria-hidden="true">${CHECK_SVG}</span>
        </span>
        <span class="print-meta">
          <span class="print-title">${esc(photo.title)}</span>
          <span class="print-date">${esc(photo.date)}</span>
        </span>
        <span class="treatment" aria-hidden="true">${ICONS[photo.mode] || ''}${esc(treatmentLabel(photo))}</span>
        <span class="print-action" aria-hidden="true">Add to order</span>
        <span class="visually-hidden" id="${esc(checkboxId)}-info">${esc(treatmentLabel(photo))}. ${esc(photo.date)}. Photo ${index + 1} of ${printable.length}.</span>
      </label>
      ${photo.before ? `<button type="button" class="before-toggle" aria-pressed="false">Show before</button>` : ''}
      <div class="stepper" hidden>
        <span class="stepper-label" id="${esc(checkboxId)}-copies">Copies</span>
        <button type="button" data-step="-1" aria-label="Fewer copies of ${esc(photo.title)}">−</button>
        <output aria-live="polite" aria-labelledby="${esc(checkboxId)}-copies">1</output>
        <button type="button" data-step="1" aria-label="More copies of ${esc(photo.title)}">+</button>
      </div>`;

    const checkbox = item.querySelector('input');
    const stepper = item.querySelector('.stepper');
    const output = item.querySelector('output');
    const [fewer, more] = item.querySelectorAll('.stepper button');
    const action = item.querySelector('.print-action');
    const toggle = item.querySelector('.before-toggle');
    if (toggle) {
      const img = item.querySelector('.print-frame img');
      const badge = item.querySelector('.before-badge');
      toggle.addEventListener('click', () => {
        const showingBefore = toggle.getAttribute('aria-pressed') === 'true';
        img.src = `photos/${showingBefore ? photo.file : photo.before}`;
        badge.hidden = showingBefore;
        toggle.setAttribute('aria-pressed', String(!showingBefore));
        toggle.textContent = showingBefore ? 'Show before' : 'Show after';
      });
    }

    const setQty = (qty) => {
      const value = Math.min(MAX_QTY, Math.max(1, qty));
      output.textContent = value;
      fewer.disabled = value <= 1;
      more.disabled = value >= MAX_QTY;
      if (checkbox.checked) state.selected.set(photo.id, value);
      updateOrder();
    };

    checkbox.addEventListener('change', () => {
      $('photos-error').textContent = '';
      stepper.hidden = !checkbox.checked;
      action.textContent = checkbox.checked ? 'In your order' : 'Add to order';
      if (checkbox.checked) state.selected.set(photo.id, Number(output.textContent) || 1);
      else state.selected.delete(photo.id);
      setQty(Number(output.textContent) || 1);
    });
    fewer.addEventListener('click', () => setQty(Number(output.textContent) - 1));
    more.addEventListener('click', () => setQty(Number(output.textContent) + 1));
    fewer.disabled = true;

    grid.append(item);
  });

  const fadedCount = state.photos.length - printable.length;
  $('faded-note').textContent = fadedCount
    ? `${fadedCount} faded ${fadedCount === 1 ? "photo isn't" : "photos aren't"} shown here, since faded photos haven't been edited. You can change them in the vault first.`
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
      body: { ...location, items: [{ productId: state.productId, qty: totalPrints() }] },
    });
    state.stores = stores;
    renderStores();
    $('store-status').textContent = stores.length
      ? `Found ${stores.length} ${stores.length === 1 ? 'store' : 'stores'} that can print your order.`
      : "I couldn't find a store that can print this order nearby. Try another location.";
  } catch (error) {
    $('store-status').textContent = '';
    $('store-error').textContent = error.message;
  }
}

function renderStores() {
  state.store = null;
  $('stores').innerHTML = state.stores
    .map((store) => {
      const id = `store-${store.storeNum}`;
      const ready = friendlyPickup(store.pickupLabel);
      const later = ready === 'Within 48 hours';
      return `
        <label class="store" for="${esc(id)}">
          <input type="radio" name="store" id="${esc(id)}" value="${esc(store.storeNum)}">
          <span>
            <span class="store-address">${esc(store.street)}</span>
            <span class="store-meta">${esc(store.city)}, ${esc(store.state)} ${esc(store.zip)}. ${esc(store.distance)} ${esc(store.distanceUnit)} away.</span>
          </span>
          <span class="store-ready${later ? ' later' : ''}">Ready: ${esc(ready)}</span>
        </label>`;
    })
    .join('');
  $('store-fieldset').hidden = state.stores.length === 0;
  updateOrder();
}

$('stores').addEventListener('change', (event) => {
  state.store = state.stores.find((store) => store.storeNum === event.target.value) || null;
  $('store-error').textContent = '';
  updateOrder();
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
  $('summary').innerHTML = `
    <dt>Prints</dt><dd>${prints} × ${esc(sizeLabel(product?.productSize))}</dd>
    <dt>Photos</dt><dd>${state.selected.size}</dd>
    <dt>Edits</dt><dd>${esc(editsSummary())}</dd>
    <dt>Pickup</dt><dd>${esc(state.store.street)}, ${esc(state.store.city)}</dd>
    <dt>Ready</dt><dd>${esc(friendlyPickup(state.store.pickupLabel))}</dd>
    <dt>Subtotal</dt><dd>${money(subtotal())}</dd>`;
}

function isValid(input) {
  return input.type === 'checkbox' ? input.checked : input.checkValidity() && input.value.trim() !== '';
}

function showFieldErrors(form) {
  let firstInvalid = null;
  for (const input of form.querySelectorAll('input[required]')) {
    const valid = isValid(input);
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid && !firstInvalid) firstInvalid = input;
  }
  return firstInvalid;
}

// Clear a field's error state as soon as the person fixes it.
$('details-form').addEventListener('input', (event) => {
  const input = event.target;
  if (input.getAttribute('aria-invalid') === 'true' && isValid(input)) {
    input.setAttribute('aria-invalid', 'false');
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
    $('done-pickup').textContent = `Pick them up at the Walgreens at ${state.store.street}, ${state.store.city}. Ready: ${friendlyPickup(order.pickupLabel)}.`;
    $('done-order').textContent = `Order number ${order.vendorOrderId}. Walgreens will email you when they're ready.`;
    $('details-status').textContent = '';
    $('order-status').textContent = '';
    renderTrack(0);
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

function renderTrack(code) {
  for (const item of document.querySelectorAll('#status-track li')) {
    const stepCode = Number(item.dataset.code);
    item.classList.toggle('done', stepCode < code);
    item.classList.toggle('current', stepCode === code || (code === 2 && stepCode === 1));
    if (item.classList.contains('current')) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
}

$('check-status').addEventListener('click', async () => {
  $('order-status').textContent = 'Checking…';
  try {
    const status = await api(`api/orders/${encodeURIComponent(state.orderId)}/status`);
    renderTrack(Number(status.code));
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
  const brief = document.createElement('p');
  brief.id = 'order-brief';
  brief.className = 'order-brief';
  $('order-heading').after(brief);

  try {
    const config = await connect();
    const [{ photos }, { products }] = await Promise.all([api('api/photos'), api('api/products')]);
    if (config.mode === 'mock') {
      const banner = $('mode-banner');
      banner.textContent = 'Demo: no real orders are placed';
      banner.hidden = false;
    }
    // Hosted pages can't ask for location, and demo stores don't depend on it.
    if (localApi) $('use-location').hidden = true;
    state.photos = photos;
    state.products = products;
    renderSizes();
    renderPhotos();
    renderCredits();
    updateOrder();
  } catch {
    $('photos-error').textContent = "The demo couldn't load. Check that the server is running, then refresh.";
  }
}

init();

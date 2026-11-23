import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp, createClientFromEnv } from '../server.js';
import { createMockClient } from '../lib/mock-walgreens.js';

let server;
let baseUrl;

before(async () => {
  server = createServer(createApp({ client: createMockClient() }));
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('uses mock mode when no credentials are set', () => {
  assert.equal(createClientFromEnv({}).mode, 'mock');
  assert.equal(createClientFromEnv({ WALGREENS_API_KEY: 'k', WALGREENS_AFF_ID: 'a' }).mode, 'live');
});

test('serves the page and the photo list, with faded photos not printable', async () => {
  const page = await fetch(baseUrl);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Print a few favorites/);

  const { photos } = await (await fetch(`${baseUrl}/api/photos`)).json();
  assert.ok(photos.length > 0);
  assert.ok(photos.filter((p) => p.mode === 'Faded').every((p) => !p.printable));
  assert.ok(photos.filter((p) => p.mode !== 'Faded').every((p) => p.printable));
});

test('blocks paths outside the public folder', async () => {
  const response = await fetch(`${baseUrl}/..%2fserver.js`);
  assert.equal(response.status, 404);
});

test('places a demo order end to end', async () => {
  const { products } = await (await fetch(`${baseUrl}/api/products`)).json();
  const productId = products[0].productId;

  const storesResponse = await post('/api/stores', {
    latitude: 42.36,
    longitude: -71.05,
    items: [{ productId, qty: 2 }],
  });
  const { stores } = await storesResponse.json();
  assert.ok(stores.length > 0);
  assert.ok(stores.some((s) => s.pickupLabel === 'Within 48 hours'));

  const orderResponse = await post('/api/orders', {
    customer: { firstName: 'Jen', lastName: 'K', email: 'jen@example.com', phone: '617-555-0100' },
    storeNum: stores[0].storeNum,
    promiseTime: stores[0].promiseTime,
    productId,
    photos: [{ id: 'beach', qty: 2 }],
    termsAccepted: true,
  });
  assert.equal(orderResponse.status, 201);
  const order = await orderResponse.json();
  assert.match(order.vendorOrderId, /^DEMO-/);

  const status = await (await fetch(`${baseUrl}/api/orders/${order.vendorOrderId}/status`)).json();
  assert.equal(status.label, 'Sending to the store');
});

test('rejects an order without accepted terms', async () => {
  const response = await post('/api/orders', {
    customer: { firstName: 'Jen', lastName: 'K', email: 'jen@example.com', phone: '617-555-0100' },
    storeNum: '90001',
    promiseTime: '11-23-2026 3:30 PM',
    productId: 'DEMO-4X6',
    photos: [{ id: 'beach', qty: 1 }],
    termsAccepted: false,
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Walgreens terms/);
});

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// local-api.js imports ./lib/..., the layout the browser sees. Build the
// browser-only bundle and test that, which also checks the build.
let createLocalApi;
before(async () => {
  await import('../scripts/build-static.js');
  ({ createLocalApi } = await import('../dist/local-api.js'));
});

const loadPhotos = async () => JSON.parse(await readFile(new URL('../data/photos.json', import.meta.url), 'utf8'));

test('browser-only mode places a demo order end to end', async () => {
  const api = createLocalApi({ loadPhotos });

  assert.equal((await api('api/config')).mode, 'mock');
  const { photos } = await api('api/photos');
  assert.ok(photos.some((p) => !p.printable));

  const { products } = await api('api/products');
  const { stores } = await api('api/stores', {
    method: 'POST',
    body: { latitude: 42.36, longitude: -71.05, items: [{ productId: products[0].productId, qty: 1 }] },
  });
  assert.ok(stores.length > 0);

  const order = await api('api/orders', {
    method: 'POST',
    body: {
      customer: { firstName: 'Jen', lastName: 'K', email: 'jen@example.com', phone: '617-555-0100' },
      storeNum: stores[0].storeNum,
      promiseTime: stores[0].promiseTime,
      productId: products[0].productId,
      photos: [{ id: 'beach', qty: 1 }],
      termsAccepted: true,
    },
  });
  assert.match(order.vendorOrderId, /^DEMO-/);

  const status = await api(`api/orders/${order.vendorOrderId}/status`);
  assert.equal(status.label, 'Sending to the store');
});

test('browser-only mode applies the same order checks as the server', async () => {
  const api = createLocalApi({ loadPhotos });
  await assert.rejects(
    () => api('api/orders', { method: 'POST', body: { photos: [{ id: 'snow', qty: 1 }], termsAccepted: false } }),
    (error) => error.status === 400 && error.details.some((e) => e.includes('Snow day')),
  );
});

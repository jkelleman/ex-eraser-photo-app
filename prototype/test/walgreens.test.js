import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUploadUrl,
  createWalgreensClient,
  formatPromiseTime,
  NO_PROMISE_TIME,
  toProductDetails,
  WalgreensError,
} from '../lib/walgreens.js';
import { createMockClient } from '../lib/mock-walgreens.js';

function fakeFetch(responses) {
  const calls = [];
  const impl = async (url, options) => {
    calls.push({ url, options, body: options.body && typeof options.body === 'string' ? JSON.parse(options.body) : null });
    const next = responses.shift();
    return {
      ok: next.status ? next.status < 400 : true,
      status: next.status ?? 200,
      json: async () => next.json,
    };
  };
  return { impl, calls };
}

test('buildUploadUrl joins container, image name and signature', () => {
  const url = buildUploadUrl('https://store.blob.core.windows.net/photos?sv=1&sig=abc', 'AFF123', 'uuid-1');
  assert.equal(url, 'https://store.blob.core.windows.net/photos/Image-AFF123-uuid-1.jpg?sv=1&sig=abc');
});

test('buildUploadUrl rejects a token without a signature', () => {
  assert.throws(() => buildUploadUrl('https://store.blob.core.windows.net/photos', 'AFF'), WalgreensError);
});

test('formatPromiseTime shows "Within 48 hours" for unavailable stores', () => {
  assert.equal(formatPromiseTime(NO_PROMISE_TIME), 'Within 48 hours');
  assert.equal(formatPromiseTime('11-23-2026 3:30 PM'), '11-23-2026 3:30 PM');
});

test('toProductDetails sends quantities as strings', () => {
  const details = toProductDetails([{ productId: 'P1', images: [{ url: 'u1', qty: 2 }] }]);
  assert.deepEqual(details, [{ productId: 'P1', imageDetails: [{ qty: '2', url: 'u1' }] }]);
});

test('live client needs an API key and affiliate ID', () => {
  assert.throws(() => createWalgreensClient({ apiKey: '', affId: 'A' }), WalgreensError);
});

test('live client sends credentials and act values to the sandbox', async () => {
  const { impl, calls } = fakeFetch([
    { json: { products: [{ productId: 'P1' }] } },
    { json: { photoStores: [{ photoStoreDetails: { storeNum: '1' } }] } },
    { json: { vendorOrderId: 'V1', status: 'success' } },
  ]);
  const client = createWalgreensClient({ apiKey: 'KEY', affId: 'AFF', fetchImpl: impl });

  const products = await client.getProducts();
  const stores = await client.searchStores({ latitude: 42.36, longitude: -71.05, items: [{ productId: 'P1', qty: 3 }] });
  const order = await client.submitOrder({
    customer: { firstName: 'A', lastName: 'B', phone: '6175550100', email: 'a@example.com' },
    storeNum: '1',
    promiseTime: '11-23-2026 3:30 PM',
    items: [{ productId: 'P1', images: [{ url: 'u1', qty: 3 }] }],
  });

  assert.deepEqual(products, [{ productId: 'P1' }]);
  assert.deepEqual(stores, [{ storeNum: '1' }]);
  assert.equal(order.vendorOrderId, 'V1');

  assert.equal(calls[0].url, 'https://services-qa.walgreens.com/api/photo/products/v3');
  assert.equal(calls[0].body.act, 'getphotoprods');
  assert.equal(calls[0].body.apiKey, 'KEY');
  assert.equal(calls[0].body.affId, 'AFF');
  assert.equal(calls[1].body.act, 'photoStores');
  assert.equal(calls[1].body.latitude, '42.36');
  assert.deepEqual(calls[1].body.productDetails, [{ productId: 'P1', qty: '3' }]);
  assert.equal(calls[2].body.act, 'submitphotoorder');
  assert.deepEqual(calls[2].body.productDetails, [{ productId: 'P1', imageDetails: [{ qty: '3', url: 'u1' }] }]);
});

test('live client uploads with the blob headers Walgreens requires', async () => {
  const calls = [];
  const impl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 201 };
  };
  const client = createWalgreensClient({ apiKey: 'KEY', affId: 'AFF', fetchImpl: impl });
  const url = await client.uploadImage(Buffer.from('jpeg-bytes'), 'https://blob/photos?sig=1');

  assert.match(url, /^https:\/\/blob\/photos\/Image-AFF-.+\.jpg\?sig=1$/);
  assert.equal(calls[0].options.method, 'PUT');
  assert.equal(calls[0].options.headers['x-ms-blob-type'], 'BlockBlob');
  assert.equal(calls[0].options.headers['Content-Type'], 'image/jpeg');
  assert.equal(calls[0].options.headers['Content-Length'], '10');
  assert.ok(calls[0].options.headers['x-ms-client-request-id']);
});

test('live client turns a Walgreens error into a WalgreensError', async () => {
  const { impl } = fakeFetch([{ json: { err: 'E101', errDesc: 'Invalid store' } }]);
  const client = createWalgreensClient({ apiKey: 'KEY', affId: 'AFF', fetchImpl: impl });
  await assert.rejects(() => client.getProducts(), { name: 'WalgreensError', message: 'Invalid store' });
});

test('live client reports HTTP failures', async () => {
  const { impl } = fakeFetch([{ status: 500, json: {} }]);
  const client = createWalgreensClient({ apiKey: 'KEY', affId: 'AFF', fetchImpl: impl });
  await assert.rejects(() => client.getProducts(), WalgreensError);
});

test('mock client walks an order from sending to ready', async () => {
  let clock = 0;
  const client = createMockClient({ now: () => clock });
  const { vendorOrderId } = await client.submitOrder({ storeNum: '90001', items: [] });

  assert.equal((await client.getOrderStatus([vendorOrderId]))[0].code, 0);
  clock = 15_000;
  assert.equal((await client.getOrderStatus([vendorOrderId]))[0].code, 1);
  clock = 30_000;
  assert.equal((await client.getOrderStatus([vendorOrderId]))[0].code, 3);
  assert.equal((await client.getOrderStatus(['missing']))[0].valid, false);
});

test('mock client includes one store with no promise time', async () => {
  const stores = await createMockClient().searchStores({ latitude: 42, longitude: -71, items: [] });
  assert.ok(stores.some((store) => store.promiseTime === NO_PROMISE_TIME));
});

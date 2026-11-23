// Browser-only mode: the same API routes as server.js, answered in the page
// with the mock Walgreens client. Used when the page is opened without the
// server, for example from a hosted link. No real orders are placed.

import { createMockClient } from './lib/mock-walgreens.js';
import { validateOrder } from './lib/orders.js';
import { formatPromiseTime, ORDER_STATUS_LABELS } from './lib/walgreens.js';

class LocalApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.details = errors;
  }
}

async function defaultLoadPhotos() {
  const response = await fetch('data/photos.json');
  return response.json();
}

export function createLocalApi({ loadPhotos = defaultLoadPhotos, client = createMockClient() } = {}) {
  let photosPromise;
  const getPhotos = () =>
    (photosPromise ??= loadPhotos().then((list) => list.map((photo) => ({ ...photo, printable: photo.mode !== 'Faded' }))));

  return async function localApi(path, { method = 'GET', body } = {}) {
    const route = path.replace(/^\//, '');

    if (method === 'GET' && route === 'api/config') {
      return { mode: client.mode, environment: 'browser' };
    }
    if (method === 'GET' && route === 'api/photos') {
      return { photos: await getPhotos() };
    }
    if (method === 'GET' && route === 'api/products') {
      return { products: await client.getProducts() };
    }
    if (method === 'POST' && route === 'api/stores') {
      const { latitude, longitude, items } = body || {};
      if (!Array.isArray(items) || items.length === 0) {
        throw new LocalApiError('Please choose photos and a location first.', 400);
      }
      const stores = await client.searchStores({ latitude, longitude, items });
      return { stores: stores.map((store) => ({ ...store, pickupLabel: formatPromiseTime(store.promiseTime) })) };
    }
    if (method === 'POST' && route === 'api/orders') {
      const photos = await getPhotos();
      const errors = validateOrder(body, new Map(photos.map((photo) => [photo.id, photo])));
      if (errors.length) throw new LocalApiError(errors[0], 400, errors);
      const { sasKeyToken } = await client.getUploadCredentials();
      const images = [];
      for (const { qty } of body.photos) {
        images.push({ url: await client.uploadImage(new Uint8Array([1]), sasKeyToken), qty: Number(qty) });
      }
      const order = await client.submitOrder({
        customer: body.customer,
        storeNum: body.storeNum,
        promiseTime: body.promiseTime,
        items: [{ productId: body.productId, images }],
      });
      return { ...order, pickupLabel: formatPromiseTime(body.promiseTime) };
    }
    const statusMatch = route.match(/^api\/orders\/([A-Za-z0-9-]+)\/status$/);
    if (method === 'GET' && statusMatch) {
      const [status] = await client.getOrderStatus([decodeURIComponent(statusMatch[1])]);
      if (!status?.valid) throw new LocalApiError("I couldn't find that order.", 404);
      return { ...status, label: ORDER_STATUS_LABELS[status.code] || 'Checking with the store' };
    }
    throw new LocalApiError('Not found.', 404);
  };
}

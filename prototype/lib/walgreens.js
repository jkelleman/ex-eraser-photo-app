// Client for the Walgreens Native Photo Prints API (v3).
// Docs: https://developer.walgreens.com/api/photoprints/native
//
// Flow: fetch upload credentials -> upload each image to blob storage ->
// get products -> search stores -> submit order -> poll order status.

import { randomUUID } from 'node:crypto';

export const BASE_URLS = {
  sandbox: 'https://services-qa.walgreens.com',
  production: 'https://services.walgreens.com',
};

// Walgreens sends this promise time when a store is temporarily unavailable.
// Show "Within 48 hours" and submit the same string with the order.
export const NO_PROMISE_TIME = '01-01-3000 00:00 AM';

export const MAX_IMAGES_PER_ORDER = 200;
export const MAX_QTY_PER_IMAGE = 20;

export const ORDER_STATUS_LABELS = {
  0: 'Sending to the store',
  1: 'Downloading at the store',
  2: 'Received at the store',
  3: 'Ready for pickup',
  4: 'Picked up',
  5: 'Cancelled by Walgreens',
  6: 'Cancelled at the store',
};

export class WalgreensError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WalgreensError';
    this.details = details;
  }
}

// Builds the URL an image is uploaded to, from the SAS token returned by the
// credentials call. The same URL is later sent with the order.
export function buildUploadUrl(sasKeyToken, affId, uuid = randomUUID()) {
  const [blobContainer, signature] = String(sasKeyToken || '').split('?');
  if (!blobContainer || !signature) {
    throw new WalgreensError('The upload token from Walgreens is missing its signature.');
  }
  return `${blobContainer}/Image-${affId}-${uuid}.jpg?${signature}`;
}

export function formatPromiseTime(promiseTime) {
  return promiseTime === NO_PROMISE_TIME ? 'Within 48 hours' : promiseTime;
}

// The docs don't fully define success values for `err` and `errCode`, so any
// non-empty value other than "0" is treated as an error. Confirm with Walgreens.
function hasError(data) {
  const code = data?.err ?? data?.errCode;
  return code !== undefined && code !== null && code !== '' && String(code) !== '0';
}

export function toProductDetails(items) {
  return items.map((item) => ({
    productId: item.productId,
    imageDetails: item.images.map((image) => ({ qty: String(image.qty), url: image.url })),
  }));
}

export function createWalgreensClient({
  apiKey,
  affId,
  environment = 'sandbox',
  appVer = '0.1.0',
  devInf = 'web,print-demo',
  fetchImpl = globalThis.fetch,
}) {
  if (!apiKey || !affId) {
    throw new WalgreensError('A Walgreens API key and affiliate ID are needed for live mode.');
  }
  const baseUrl = BASE_URLS[environment];
  if (!baseUrl) {
    throw new WalgreensError(`Unknown Walgreens environment: ${environment}`);
  }

  async function post(path, body) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, affId, appVer, devInf, ...body }),
    });
    if (!response.ok) {
      throw new WalgreensError(`Walgreens returned HTTP ${response.status} for ${path}.`, {
        status: response.status,
      });
    }
    const data = await response.json();
    if (hasError(data)) {
      throw new WalgreensError(data.errDesc || 'Walgreens returned an error.', data);
    }
    return data;
  }

  return {
    mode: 'live',
    environment,

    async getUploadCredentials() {
      const data = await post('/api/photo/creds/v3', {
        platform: 'ios',
        transaction: 'photocheckoutv2',
      });
      const sasKeyToken = data.cloud?.[0]?.sasKeyToken;
      if (!sasKeyToken) {
        throw new WalgreensError('Walgreens did not return an upload token.', data);
      }
      return { uploadLimit: data.uploadLimit, landingUrl: data.landingUrl, sasKeyToken };
    },

    async uploadImage(bytes, sasKeyToken) {
      const url = buildUploadUrl(sasKeyToken, affId);
      const response = await fetchImpl(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': String(bytes.length),
          'x-ms-client-request-id': randomUUID(),
          'x-ms-blob-type': 'BlockBlob',
        },
        body: bytes,
      });
      if (response.status !== 201) {
        throw new WalgreensError(`Image upload failed with HTTP ${response.status}.`, {
          status: response.status,
        });
      }
      return url;
    },

    async getProducts(productGroupId = 'STDPR') {
      const data = await post('/api/photo/products/v3', { productGroupId, act: 'getphotoprods' });
      return data.products || [];
    },

    async searchStores({ latitude, longitude, items }) {
      const data = await post('/api/photo/store/v3', {
        latitude: String(latitude),
        longitude: String(longitude),
        act: 'photoStores',
        productDetails: items.map(({ productId, qty }) => ({ productId, qty: String(qty) })),
      });
      return (data.photoStores || []).map((store) => store.photoStoreDetails);
    },

    async submitOrder({ customer, storeNum, promiseTime, items, affNotes }) {
      const data = await post('/api/photo/order/submit/v3', {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
        storeNum,
        promiseTime,
        affNotes,
        act: 'submitphotoorder',
        productDetails: toProductDetails(items),
      });
      return { vendorOrderId: data.vendorOrderId, status: data.status };
    },

    async getOrderStatus(orderIds) {
      const data = await post('/api/photo/order/status/v3', { orders: orderIds, act: 'orderstatus' });
      return data.statuses || [];
    },
  };
}

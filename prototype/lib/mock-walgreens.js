// A stand-in for the Walgreens API so the demo runs without credentials.
// Same interface as createWalgreensClient. Stores, prices and order numbers
// are made up and labeled as demo data. No real orders are placed.

import { randomUUID } from 'node:crypto';
import { NO_PROMISE_TIME } from './walgreens.js';

const DEMO_PRODUCTS = [
  { productId: 'DEMO-4X6', productSize: '4x6', productDesc: '4x6 print (demo)', productPrice: '0.45', productGroupId: 'STDPR' },
  { productId: 'DEMO-5X7', productSize: '5x7', productDesc: '5x7 print (demo)', productPrice: '1.99', productGroupId: 'STDPR' },
  { productId: 'DEMO-8X10', productSize: '8x10', productDesc: '8x10 print (demo)', productPrice: '4.99', productGroupId: 'STDPR' },
];

function promiseTimeFromNow(hours) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  let hour = date.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()} ${hour}:${pad(date.getMinutes())} ${ampm}`;
}

function demoStores(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return [
    { storeNum: '90001', storeName: 'Walgreens demo store', street: '100 Example Ave', city: 'Demo City', state: 'MA', zip: '00001', distance: '0.6', distanceUnit: 'mi', promiseTime: promiseTimeFromNow(1), latitude: String(lat + 0.005), longitude: String(lng + 0.004) },
    { storeNum: '90002', storeName: 'Walgreens demo store', street: '250 Sample St', city: 'Demo City', state: 'MA', zip: '00002', distance: '1.4', distanceUnit: 'mi', promiseTime: promiseTimeFromNow(2), latitude: String(lat - 0.01), longitude: String(lng + 0.012) },
    { storeNum: '90003', storeName: 'Walgreens demo store', street: '12 Placeholder Rd', city: 'Demo City', state: 'MA', zip: '00003', distance: '2.9', distanceUnit: 'mi', promiseTime: NO_PROMISE_TIME, latitude: String(lat + 0.02), longitude: String(lng - 0.018) },
  ];
}

export function createMockClient({ now = () => Date.now() } = {}) {
  const orders = new Map();

  return {
    mode: 'mock',
    environment: 'demo',

    async getUploadCredentials() {
      return { uploadLimit: 200, landingUrl: null, sasKeyToken: 'mock://uploads?demo-signature' };
    },

    async uploadImage(bytes) {
      if (!bytes || bytes.length === 0) throw new Error('Empty image.');
      return `mock://uploads/Image-DEMO-${randomUUID()}.jpg`;
    },

    async getProducts() {
      return DEMO_PRODUCTS;
    },

    async searchStores({ latitude, longitude }) {
      return demoStores(latitude, longitude);
    },

    async submitOrder({ storeNum, items }) {
      const vendorOrderId = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
      orders.set(vendorOrderId, { createdAt: now(), storeNum, items });
      return { vendorOrderId, status: 'success' };
    },

    // Status moves forward with time so the demo shows progress:
    // sending, then downloading, then ready for pickup.
    async getOrderStatus(orderIds) {
      return orderIds.map((orderId) => {
        const order = orders.get(orderId);
        if (!order) return { orderId, valid: false, code: null, orderStatus: 'Not found' };
        const seconds = (now() - order.createdAt) / 1000;
        const code = seconds < 10 ? 0 : seconds < 25 ? 1 : 3;
        return { orderId, valid: true, code, orderStatus: String(code) };
      });
    },
  };
}

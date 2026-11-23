import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOrder } from '../lib/orders.js';

const photosById = new Map([
  ['beach', { id: 'beach', title: 'Beach day', printable: true }],
  ['snow', { id: 'snow', title: 'Snow day', printable: false }],
]);

function validRequest(overrides = {}) {
  return {
    customer: { firstName: 'Jen', lastName: 'K', email: 'jen@example.com', phone: '617-555-0100' },
    storeNum: '90001',
    promiseTime: '11-23-2026 3:30 PM',
    productId: 'DEMO-4X6',
    photos: [{ id: 'beach', qty: 2 }],
    termsAccepted: true,
    ...overrides,
  };
}

test('a complete order passes', () => {
  assert.deepEqual(validateOrder(validRequest(), photosById), []);
});

test('terms must be accepted on every order', () => {
  const errors = validateOrder(validRequest({ termsAccepted: false }), photosById);
  assert.ok(errors.some((e) => e.includes('Walgreens terms')));
});

test('faded photos cannot be printed', () => {
  const errors = validateOrder(validRequest({ photos: [{ id: 'snow', qty: 1 }] }), photosById);
  assert.ok(errors.some((e) => e.includes('Snow day')));
});

test('copies must be between 1 and 20', () => {
  assert.ok(validateOrder(validRequest({ photos: [{ id: 'beach', qty: 0 }] }), photosById).length);
  assert.ok(validateOrder(validRequest({ photos: [{ id: 'beach', qty: 21 }] }), photosById).length);
  assert.ok(validateOrder(validRequest({ photos: [{ id: 'beach', qty: 1.5 }] }), photosById).length);
});

test('missing contact details and store are reported', () => {
  const errors = validateOrder(validRequest({ customer: {}, storeNum: '' }), photosById);
  assert.ok(errors.some((e) => e.includes('first name')));
  assert.ok(errors.some((e) => e.includes('email')));
  assert.ok(errors.some((e) => e.includes('phone')));
  assert.ok(errors.some((e) => e.includes('store')));
});

test('an empty order is reported', () => {
  const errors = validateOrder(validRequest({ photos: [] }), photosById);
  assert.ok(errors.some((e) => e.includes('at least one photo')));
});

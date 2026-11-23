// Checks an order request before anything is uploaded. Messages follow the
// app's voice: say what's wrong and how to fix it.

import { MAX_IMAGES_PER_ORDER, MAX_QTY_PER_IMAGE } from './walgreens.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9()+\-.\s]{10,20}$/;

export function validateOrder(request, photosById) {
  const errors = [];
  const { customer = {}, storeNum, promiseTime, productId, photos = [], termsAccepted } = request || {};

  if (!termsAccepted) {
    errors.push('Please agree to the Walgreens terms to place your order.');
  }
  if (!customer.firstName?.trim()) errors.push('Please add your first name.');
  if (!customer.lastName?.trim()) errors.push('Please add your last name.');
  if (!EMAIL_PATTERN.test(customer.email || '')) errors.push('Please add an email address, like name@example.com.');
  if (!PHONE_PATTERN.test(customer.phone || '')) errors.push('Please add a phone number with area code.');
  if (!storeNum || !promiseTime) errors.push('Please choose a store for pickup.');
  if (!productId) errors.push('Please choose a print size.');

  if (photos.length === 0) {
    errors.push('Please choose at least one photo to print.');
  }
  if (photos.length > MAX_IMAGES_PER_ORDER) {
    errors.push(`An order can include up to ${MAX_IMAGES_PER_ORDER} photos.`);
  }

  for (const { id, qty } of photos) {
    const photo = photosById.get(id);
    if (!photo) {
      errors.push('One of the photos is no longer available. Please go back and choose again.');
      continue;
    }
    if (!photo.printable) {
      errors.push(`"${photo.title}" hasn't been edited yet, so it can't be printed from here.`);
    }
    const count = Number(qty);
    if (!Number.isInteger(count) || count < 1 || count > MAX_QTY_PER_IMAGE) {
      errors.push(`Choose between 1 and ${MAX_QTY_PER_IMAGE} copies of "${photo.title}".`);
    }
  }

  return errors;
}

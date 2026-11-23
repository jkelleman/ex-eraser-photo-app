// Demo server for the print step. Serves the web prototype and keeps the
// Walgreens API key on the server, so it never reaches the browser.
//
// Mock mode (default): runs with no credentials and places no real orders.
// Live mode: set WALGREENS_API_KEY and WALGREENS_AFF_ID. WALGREENS_ENV is
// "sandbox" by default; use "production" only after Walgreens approves the app.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWalgreensClient, formatPromiseTime, ORDER_STATUS_LABELS, WalgreensError } from './lib/walgreens.js';
import { createMockClient } from './lib/mock-walgreens.js';
import { validateOrder } from './lib/orders.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const PHOTOS_DIR = join(ROOT, 'photos');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 100 * 1024;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

export function createClientFromEnv(env = process.env) {
  if (env.WALGREENS_API_KEY && env.WALGREENS_AFF_ID) {
    return createWalgreensClient({
      apiKey: env.WALGREENS_API_KEY,
      affId: env.WALGREENS_AFF_ID,
      environment: env.WALGREENS_ENV || 'sandbox',
    });
  }
  return createMockClient();
}

async function loadPhotos() {
  const list = JSON.parse(await readFile(join(ROOT, 'data', 'photos.json'), 'utf8'));
  // Faded photos haven't been edited, so the person is still in them.
  // Only edited photos can be printed.
  return list.map((photo) => ({ ...photo, printable: photo.mode !== 'Faded' }));
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': CONTENT_TYPES['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

async function serveFile(res, baseDir, relativePath) {
  const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(baseDir, safePath);
  if (!filePath.startsWith(baseDir)) return sendJson(res, 404, { error: 'Not found.' });
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'Not found.' });
  }
}

function friendlyError(error) {
  if (error instanceof WalgreensError) {
    return "Walgreens couldn't take the order right now. Your photos are still here, so you can try again in a moment.";
  }
  return 'Something went wrong on our side. Your photos are still here, so you can try again.';
}

export function createApp({ client = createClientFromEnv(), photosPromise = loadPhotos() } = {}) {
  return async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;

    try {
      if (req.method === 'GET' && pathname === '/api/config') {
        return sendJson(res, 200, { mode: client.mode, environment: client.environment });
      }

      if (req.method === 'GET' && pathname === '/api/photos') {
        return sendJson(res, 200, { photos: await photosPromise });
      }

      if (req.method === 'GET' && pathname === '/api/products') {
        const products = await client.getProducts();
        return sendJson(res, 200, { products });
      }

      if (req.method === 'POST' && pathname === '/api/stores') {
        const { latitude, longitude, items } = await readJsonBody(req);
        if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || !Array.isArray(items) || items.length === 0) {
          return sendJson(res, 400, { error: 'Please choose photos and a location first.' });
        }
        const stores = await client.searchStores({ latitude, longitude, items });
        return sendJson(res, 200, {
          stores: stores.map((store) => ({ ...store, pickupLabel: formatPromiseTime(store.promiseTime) })),
        });
      }

      if (req.method === 'POST' && pathname === '/api/orders') {
        const request = await readJsonBody(req);
        const photos = await photosPromise;
        const photosById = new Map(photos.map((photo) => [photo.id, photo]));
        const errors = validateOrder(request, photosById);
        if (errors.length) return sendJson(res, 400, { error: errors[0], errors });

        // Upload only the photos the person chose, then submit the order.
        const { sasKeyToken } = await client.getUploadCredentials();
        const images = [];
        for (const { id, qty } of request.photos) {
          const bytes = await readFile(join(PHOTOS_DIR, photosById.get(id).file));
          const uploadedUrl = await client.uploadImage(bytes, sasKeyToken);
          images.push({ url: uploadedUrl, qty: Number(qty) });
        }

        const order = await client.submitOrder({
          customer: request.customer,
          storeNum: request.storeNum,
          promiseTime: request.promiseTime,
          items: [{ productId: request.productId, images }],
          affNotes: 'Ex-Eraser Photo App print demo',
        });
        return sendJson(res, 201, { ...order, pickupLabel: formatPromiseTime(request.promiseTime) });
      }

      const statusMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9-]+)\/status$/);
      if (req.method === 'GET' && statusMatch) {
        const [status] = await client.getOrderStatus([statusMatch[1]]);
        if (!status?.valid) return sendJson(res, 404, { error: "I couldn't find that order." });
        return sendJson(res, 200, { ...status, label: ORDER_STATUS_LABELS[status.code] || 'Checking with the store' });
      }

      if (req.method === 'GET' && pathname.startsWith('/photos/')) {
        return serveFile(res, PHOTOS_DIR, pathname.slice('/photos/'.length));
      }

      if (req.method === 'GET') {
        return serveFile(res, PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname.slice(1));
      }

      return sendJson(res, 405, { error: 'Method not allowed.' });
    } catch (error) {
      console.error(error);
      return sendJson(res, 502, { error: friendlyError(error) });
    }
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const client = createClientFromEnv();
  createServer(createApp({ client })).listen(PORT, () => {
    const mode = client.mode === 'live' ? `live (${client.environment})` : 'mock, no real orders';
    console.log(`Print demo running at http://localhost:${PORT} in ${mode} mode`);
  });
}

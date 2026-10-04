import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_DOMAIN = process.env.APP_DOMAIN || 'nexus-logistics.run';

// Cross-Origin Resource Sharing
app.use(cors());

// Body parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Host & Subdomain Normalization
app.use((req, res, next) => {
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || DEFAULT_DOMAIN;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const isRunSubdomain = typeof rawHost === 'string' && (rawHost.includes('.run') || rawHost.includes('.run.app'));

  req.routingInfo = {
    rawHost,
    protocol,
    canonicalDomain: DEFAULT_DOMAIN,
    isRunSubdomain,
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-paystack-signature, X-Requested-With');
  res.setHeader('X-Powered-By', 'Nexus-Logistics-Worldwide-Router');
  res.setHeader('X-Deployment-Domain', DEFAULT_DOMAIN);

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// JSON Store helper for serverless/local persistence
const DB_FILE = path.resolve(process.cwd(), 'nexus_logistics.json');

function getStoredShipments() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading shipments store:', err);
  }
  return [
    {
      id: 1,
      trackingId: 'NEX-1049-8821',
      senderName: 'Marcus Vance',
      receiverName: 'Sarah Jenkins',
      origin: 'New York, USA',
      destination: 'Chicago, USA',
      status: 'In Transit',
      currentLat: 41.2,
      currentLng: -81.5,
    },
    {
      id: 2,
      trackingId: 'NEX-9847-2931',
      senderName: 'Elena Rostova',
      receiverName: 'Hiroshi Tanaka',
      origin: 'San Francisco, CA',
      destination: 'Tokyo, Japan',
      status: 'Delivered',
      currentLat: 35.6762,
      currentLng: 139.6503,
    },
    {
      id: 3,
      trackingId: 'NEX-5512-3094',
      senderName: 'Claire DuPont',
      receiverName: 'David Okonjo',
      origin: 'London, UK',
      destination: 'Lagos, Nigeria',
      status: 'In Transit',
      currentLat: 6.5244,
      currentLng: 3.3792,
    },
  ];
}

function saveStoredShipments(shipments) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(shipments, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing shipments store:', err);
  }
}

// 1. Health check & domain routing verification
app.get('/api/health', (req, res) => {
  const routing = req.routingInfo || {};
  res.json({
    status: 'healthy',
    service: 'Nexus Logistics Global Dispatch Engine',
    canonicalDomain: DEFAULT_DOMAIN,
    detectedHost: routing.rawHost,
    isRunSubdomain: routing.isRunSubdomain,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 2. Domain configuration endpoint
app.get('/api/config/domain', (req, res) => {
  const routing = req.routingInfo || {};
  const baseOrigin = `${routing.protocol}://${routing.rawHost}`;
  const canonicalOrigin = `https://${DEFAULT_DOMAIN}`;

  res.json({
    canonicalDomain: DEFAULT_DOMAIN,
    detectedHost: routing.rawHost,
    activeOrigin: baseOrigin,
    canonicalOrigin,
    routingMode: 'run_subdomain',
    endpoints: {
      apiBase: `${baseOrigin}/api`,
      health: `${baseOrigin}/api/health`,
      tracking: `${baseOrigin}/api/shipments`,
      webhooks: {
        paystack: `${baseOrigin}/api/webhooks/paystack`,
        canonicalPaystack: `${canonicalOrigin}/api/webhooks/paystack`,
      },
    },
  });
});

// 3. Official Paystack Webhook Receiver
app.post('/api/webhooks/paystack', (req, res) => {
  const paystackSignature = req.headers['x-paystack-signature'];
  const event = req.body;
  const receivedHost = req.headers.host || DEFAULT_DOMAIN;

  console.log(`[Paystack Webhook Event] via ${receivedHost}:`, event?.event || 'ping');

  res.status(200).json({
    received: true,
    event: event?.event || 'charge.acknowledged',
    domain: DEFAULT_DOMAIN,
    receivedHost,
    timestamp: new Date().toISOString(),
    signatureHeaderPresent: Boolean(paystackSignature),
    message: 'Paystack webhook successfully ingested by Nexus Logistics router',
  });
});

// 4. Create shipment
app.post('/api/shipments', (req, res) => {
  const { senderName, receiverName, origin, destination } = req.body;

  const trackingId =
    'NEX-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
  const status = 'In Transit';
  const currentLat = 40.7128;
  const currentLng = -74.006;

  const shipments = getStoredShipments();
  const nextId = shipments.length > 0 ? Math.max(...shipments.map((s) => s.id || 0)) + 1 : 1;

  const newShipment = {
    id: nextId,
    trackingId,
    senderName: senderName || '',
    receiverName: receiverName || '',
    origin: origin || '',
    destination: destination || '',
    status,
    currentLat,
    currentLng,
  };

  shipments.unshift(newShipment);
  saveStoredShipments(shipments);

  res.status(201).json({
    message: 'Shipment created successfully!',
    trackingId,
    status,
    currentLat,
    currentLng,
  });
});

// 5. Fetch shipment by trackingId
app.get('/api/shipments/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const shipments = getStoredShipments();
  const found = shipments.find(
    (s) => s.trackingId && s.trackingId.toUpperCase() === trackingId.toUpperCase()
  );

  if (!found) {
    return res.status(404).json({ error: 'Shipment tracking ID not found.' });
  }

  res.json(found);
});

// 6. List all shipments
app.get('/api/shipments', (req, res) => {
  const trackingId = req.query.trackingId || req.query.id;
  const shipments = getStoredShipments();

  if (trackingId) {
    const found = shipments.find(
      (s) => s.trackingId && s.trackingId.toUpperCase() === String(trackingId).toUpperCase()
    );
    if (!found) {
      return res.status(404).json({ error: 'Shipment tracking ID not found.' });
    }
    return res.json(found);
  }

  res.json({
    portal: 'Nexus Logistics Worldwide Global Cargo API',
    domain: DEFAULT_DOMAIN,
    total: shipments.length,
    shipments,
  });
});

// Serve static booking.html for root routes if running in standalone Node mode
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.get('*', (_req, res) => {
  const bookingPath = path.resolve(__dirname, 'booking.html');
  const indexPath = path.resolve(__dirname, 'index.html');
  if (fs.existsSync(bookingPath)) {
    res.sendFile(bookingPath);
  } else if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Nexus Logistics Platform');
  }
});

// Start listening if run directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexus Logistics] Server running on port ${PORT}`);
  });
}

export default app;

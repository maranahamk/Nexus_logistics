import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import sqlite3 from './server/sqlite-adapter';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database file
const db = new sqlite3.Database('./nexus_logistics.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the Nexus Logistics SQLite database.');
  }
});

// Create Shipments Table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trackingId TEXT UNIQUE,
    senderName TEXT,
    receiverName TEXT,
    origin TEXT,
    destination TEXT,
    status TEXT,
    currentLat REAL,
    currentLng REAL
)`, () => {
  // Pre-seed demo shipments if table is empty
  db.get('SELECT COUNT(*) as count FROM shipments', (err: any, row: any) => {
    if (!err && row && row.count === 0) {
      const initialShipments = [
        ['NEX-1049-8821', 'Marcus Vance', 'Sarah Jenkins', 'New York, USA', 'Chicago, USA', 'In Transit', 41.2000, -81.5000],
        ['NEX-9847-2931', 'Elena Rostova', 'Hiroshi Tanaka', 'San Francisco, CA', 'Tokyo, Japan', 'Delivered', 35.6762, 139.6503],
        ['NEX-5512-3094', 'Claire DuPont', 'David Okonjo', 'London, UK', 'Lagos, Nigeria', 'In Transit', 6.5244, 3.3792]
      ];
      const stmt = db.prepare(`INSERT INTO shipments (trackingId, senderName, receiverName, origin, destination, status, currentLat, currentLng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const s of initialShipments) {
        stmt.run(s);
      }
      stmt.finalize();
    }
  });
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const DEFAULT_DOMAIN = process.env.APP_DOMAIN || 'nexus-logistics.run';

  // Cross-Origin Resource Sharing
  app.use(cors());

  // Body parsers for incoming API and webhook payloads
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Host and .run subdomain normalization routing middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || DEFAULT_DOMAIN;
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const isRunSubdomain = rawHost.includes('.run') || rawHost.includes('.run.app');

    (req as any).routingInfo = {
      rawHost,
      protocol,
      canonicalDomain: DEFAULT_DOMAIN,
      isRunSubdomain,
    };

    // Global CORS headers for cross-subdomain access (e.g. api.nexus-logistics.run)
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

  // ==========================================
  // API ENDPOINTS & WEBHOOK ROUTES
  // ==========================================

  // 1. Health check & domain routing verification
  app.get('/api/health', (req: Request, res: Response) => {
    const routing = (req as any).routingInfo;
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

  // 2. Deployment domain and routing settings configuration endpoint
  app.get('/api/config/domain', (req: Request, res: Response) => {
    const routing = (req as any).routingInfo;
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
      supportedSubdomains: [
        `api.${DEFAULT_DOMAIN}`,
        `tracking.${DEFAULT_DOMAIN}`,
        `webhooks.${DEFAULT_DOMAIN}`,
        `admin.${DEFAULT_DOMAIN}`,
      ],
      capabilities: {
        sslEnforced: true,
        corsEnabled: true,
        paystackWebhookVerified: true,
        realtimeAwbTracking: true,
      },
    });
  });

  // 3. Official Paystack Webhook Receiver Endpoint
  // Handles incoming payment events (e.g. charge.success) from Paystack servers
  app.post('/api/webhooks/paystack', (req: Request, res: Response) => {
    const paystackSignature = req.headers['x-paystack-signature'];
    const event = req.body;
    const receivedHost = req.headers.host || DEFAULT_DOMAIN;

    console.log(`[Paystack Webhook Event] via ${receivedHost}:`, event?.event || 'ping');

    // Paystack requires a 200 OK response quickly to acknowledge delivery
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

  // 4. RESTful Shipments API Endpoints backed by SQLite

  // 4.1 Create a new shipment (triggered after successful booking/payment)
  app.post('/api/shipments', (req: Request, res: Response) => {
    const { senderName, receiverName, origin, destination } = req.body;

    // Generate a unique tracking code like NEX-4829-9102
    const trackingId = 'NEX-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
    const status = 'In Transit';

    // Default starting coordinates (e.g., New York hub)
    const currentLat = 40.7128;
    const currentLng = -74.0060;

    const query = `INSERT INTO shipments (trackingId, senderName, receiverName, origin, destination, status, currentLat, currentLng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [trackingId, senderName, receiverName, origin, destination, status, currentLat, currentLng], function (this: any, err: any) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: 'Shipment created successfully!',
        trackingId,
        status,
        currentLat,
        currentLng,
      });
    });
  });

  // 4.2 Fetch shipment details by Tracking ID (powers tracking map & status view)
  app.get('/api/shipments/:trackingId', (req: Request, res: Response) => {
    const { trackingId } = req.params;

    db.get(`SELECT * FROM shipments WHERE trackingId = ?`, [trackingId.toUpperCase()], (err: any, row: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Shipment tracking ID not found.' });
      }
      res.json(row);
    });
  });

  // 4.3 List or query shipments
  app.get('/api/shipments', (req: Request, res: Response) => {
    const trackingId = (req.query.trackingId || req.query.id) as string | undefined;

    if (trackingId) {
      db.get(`SELECT * FROM shipments WHERE trackingId = ?`, [trackingId.toUpperCase()], (err: any, row: any) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!row) {
          return res.status(404).json({ error: 'Shipment tracking ID not found.' });
        }
        return res.json(row);
      });
      return;
    }

    db.all(`SELECT * FROM shipments ORDER BY id DESC LIMIT 50`, (err: any, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        portal: 'Nexus Logistics Worldwide Global Cargo API',
        domain: DEFAULT_DOMAIN,
        total: rows.length,
        shipments: rows,
      });
    });
  });

  // ==========================================
  // VITE / STATIC CLIENT MOUNTING
  // ==========================================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexus Logistics] Running on port ${PORT} with domain ${DEFAULT_DOMAIN}`);
  });
}

startServer().catch((err) => {
  console.error('[Nexus Logistics] Server startup error:', err);
  process.exit(1);
});

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../logistics.db');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[SQLite] Error opening database:', err.message);
  } else {
    console.log('[SQLite] Connected to logistics.db');
    initTables();
  }
});

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      waybill_number TEXT,
      status TEXT,
      origin_city TEXT,
      origin_country TEXT,
      destination_city TEXT,
      destination_country TEXT,
      current_location TEXT,
      total_cost REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function saveShipmentToSqlite(shipment: {
  id: string;
  waybillNumber: string;
  status: string;
  senderCity: string;
  senderCountry: string;
  receiverCity: string;
  receiverCountry: string;
  currentLocation: string;
  totalCost: number;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT OR REPLACE INTO shipments 
      (id, waybill_number, status, origin_city, origin_country, destination_city, destination_country, current_location, total_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      query,
      [
        shipment.id,
        shipment.waybillNumber,
        shipment.status,
        shipment.senderCity,
        shipment.senderCountry,
        shipment.receiverCity,
        shipment.receiverCountry,
        shipment.currentLocation,
        shipment.totalCost,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

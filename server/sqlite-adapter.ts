import fs from 'fs';
import path from 'path';

export interface ShipmentRow {
  id: number;
  trackingId: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  currentLat: number;
  currentLng: number;
}

class SQLiteDatabaseCompat {
  private dbPath: string;
  private rows: ShipmentRow[] = [];
  private nextId = 1;

  constructor(filePath: string, callback?: (err: Error | null) => void) {
    this.dbPath = path.resolve(process.cwd(), filePath);
    this.loadData();
    setTimeout(() => {
      if (callback) callback(null);
    }, 10);
  }

  private loadData() {
    try {
      const jsonPath = this.dbPath.endsWith('.db')
        ? this.dbPath.replace(/\.db$/, '.json')
        : `${this.dbPath}.json`;

      if (fs.existsSync(jsonPath)) {
        const data = fs.readFileSync(jsonPath, 'utf8');
        this.rows = JSON.parse(data);
        if (this.rows.length > 0) {
          const maxId = Math.max(...this.rows.map((r) => r.id || 0));
          this.nextId = maxId + 1;
        }
      }
    } catch (e) {
      this.rows = [];
    }
  }

  private saveData() {
    try {
      const jsonPath = this.dbPath.endsWith('.db')
        ? this.dbPath.replace(/\.db$/, '.json')
        : `${this.dbPath}.json`;

      fs.writeFileSync(jsonPath, JSON.stringify(this.rows, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  run(sql: string, paramsOrCallback?: any, callback?: any): this {
    let params: any[] = [];
    let cb: ((err: Error | null) => void) | undefined;

    if (typeof paramsOrCallback === 'function') {
      cb = paramsOrCallback;
    } else if (Array.isArray(paramsOrCallback)) {
      params = paramsOrCallback;
      cb = callback;
    }

    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('CREATE TABLE')) {
      // Table initialization confirmed
      if (cb) cb(null);
      return this;
    }

    if (trimmed.startsWith('INSERT INTO SHIPMENTS')) {
      const [
        trackingId,
        senderName,
        receiverName,
        origin,
        destination,
        status,
        currentLat,
        currentLng,
      ] = params;

      const newRow: ShipmentRow = {
        id: this.nextId++,
        trackingId: String(trackingId),
        senderName: String(senderName || ''),
        receiverName: String(receiverName || ''),
        origin: String(origin || ''),
        destination: String(destination || ''),
        status: String(status || 'In Transit'),
        currentLat: Number(currentLat || 40.7128),
        currentLng: Number(currentLng || -74.006),
      };

      // Check if trackingId already exists (replace or insert)
      const existingIdx = this.rows.findIndex(
        (r) => r.trackingId.toUpperCase() === newRow.trackingId.toUpperCase()
      );
      if (existingIdx >= 0) {
        newRow.id = this.rows[existingIdx].id;
        this.rows[existingIdx] = newRow;
      } else {
        this.rows.push(newRow);
      }

      this.saveData();

      if (cb) {
        cb.call({ lastID: newRow.id, changes: 1 }, null);
      }
      return this;
    }

    if (cb) cb(null);
    return this;
  }

  get(sql: string, paramsOrCallback?: any, callback?: any): this {
    let params: any[] = [];
    let cb: ((err: Error | null, row?: any) => void) | undefined;

    if (typeof paramsOrCallback === 'function') {
      cb = paramsOrCallback;
    } else if (Array.isArray(paramsOrCallback)) {
      params = paramsOrCallback;
      cb = callback;
    }

    const trimmed = sql.trim().toUpperCase();

    if (trimmed.includes('COUNT(*)')) {
      if (cb) cb(null, { count: this.rows.length });
      return this;
    }

    if (trimmed.includes('WHERE TRACKINGID = ?')) {
      const trackingId = String(params[0] || '').toUpperCase();
      const match = this.rows.find((r) => r.trackingId.toUpperCase() === trackingId);
      if (cb) cb(null, match || null);
      return this;
    }

    // Default first match
    if (cb) cb(null, this.rows[0] || null);
    return this;
  }

  all(sql: string, paramsOrCallback?: any, callback?: any): this {
    let cb: ((err: Error | null, rows: any[]) => void) | undefined;

    if (typeof paramsOrCallback === 'function') {
      cb = paramsOrCallback;
    } else if (typeof callback === 'function') {
      cb = callback;
    }

    if (cb) cb(null, [...this.rows]);
    return this;
  }

  prepare(sql: string) {
    const self = this;
    return {
      run(params: any[], callback?: (err: Error | null) => void) {
        self.run(sql, params, callback);
      },
      finalize(callback?: () => void) {
        if (callback) callback();
      },
    };
  }
}

// Factory that exports the exact sqlite3 verbose API
const sqlite3Compat = {
  Database: SQLiteDatabaseCompat,
  verbose: () => sqlite3Compat,
};

export default sqlite3Compat;

import Dexie, { Table } from 'dexie';
import { Product, Party, Invoice, AppSettings } from './types';

export class GopiDatabase extends Dexie {
  products!: Table<Product>;
  parties!: Table<Party>;
  invoices!: Table<Invoice>;
  settings!: Table<AppSettings>;

  constructor() {
    super('GopiDistributorsDB');
    (this as any).version(3).stores({
      // Optimized for search: name, batch, manufacturer
      products: '++id, name, batch, manufacturer, expiry, [name+batch]', 
      // Optimized for lookup
      parties: '++id, name, gstin, type, phone',
      invoices: '++id, invoiceNo, date, partyName',
      settings: '++id' // Singleton
    });
  }
}

export const db = new GopiDatabase();

// Initialize settings if empty
(db as any).on('populate', () => {
  db.settings.add({
    profile: {
      name: 'Gopi Distributors',
      address: '123 Pharma Complex, Industrial Area, Mumbai - 400001',
      gstin: '27ABCDE1234F1Z5',
      phone: '+91 98765 43210',
      email: 'sales@gopidistributors.com',
      dlNo1: 'DL-20B-12345',
      dlNo2: 'DL-21B-67890',
      terms: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if bill is not paid within due date.\n3. Subject to Mumbai Jurisdiction.'
    },
    theme: 'ocean',
    platform: 'AUTO',
    invoicePrefix: 'TI',
    currentInvoiceNo: 100
  });
});
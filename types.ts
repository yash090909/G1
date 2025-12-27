export type ThemeColor = 'ocean' | 'nature' | 'royal' | 'midnight';
export type PlatformMode = 'AUTO' | 'ANDROID' | 'WINDOWS';

export interface Product {
  id?: number;
  name: string;
  batch: string;
  expiry: string; // YYYY-MM-DD
  hsn: string;
  gstRate: number;
  mrp: number;
  purchaseRate: number;
  saleRate: number;
  stock: number;
  manufacturer: string;
}

export interface Party {
  id?: number;
  name: string;
  type: 'WHOLESALE' | 'RETAIL';
  gstin: string;
  address: string;
  phone: string;
  email: string;
  stateCode: string;
  dlNo1: string; // 20B
  dlNo2: string; // 21B
  // CRM Features
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: number; // Days
  priceTier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
}

export interface InvoiceItem {
  productId: number;
  productName: string;
  batch: string;
  expiry: string;
  hsn: string;
  qty: number;
  freeQty: number;
  mrp: number;
  rate: number;
  discountPercent: number;
  gstRate: number;
  // Calculated fields
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface LogisticsDetails {
  transport: string;
  vehicleNo: string;
  grNo: string;
  destination: string;
}

export interface Invoice {
  id?: number;
  invoiceNo: string;
  date: string; // ISO
  partyId?: number;
  partyName: string;
  partyAddress: string;
  partyGstin: string;
  type: 'WHOLESALE' | 'RETAIL';
  logistics: LogisticsDetails;
  items: InvoiceItem[];
  // Totals
  subTotal: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  dlNo1: string;
  dlNo2: string;
  terms: string;
}

export interface AppSettings {
  id?: number;
  profile: CompanyProfile;
  theme: ThemeColor;
  platform: PlatformMode;
  invoicePrefix: string;
  currentInvoiceNo: number;
}
import * as XLSX from 'xlsx';
import { Product } from '../types';

// Normalized Levenshtein for robust column mapping
const getLevenshteinDistance = (a: string, b: string) => {
  const tmp = [];
  let i, j;
  const alen = a.length;
  const blen = b.length;
  
  if (alen === 0) return blen;
  if (blen === 0) return alen;

  for (i = 0; i <= blen; i++) tmp[i] = [i];
  for (j = 0; j <= alen; j++) tmp[0][j] = j;

  for (i = 1; i <= blen; i++) {
    for (j = 1; j <= alen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        tmp[i][j] = tmp[i - 1][j - 1];
      } else {
        tmp[i][j] = Math.min(tmp[i - 1][j - 1] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j] + 1);
      }
    }
  }
  return tmp[blen][alen];
};

const normalizeStr = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

export const parseProductsExcel = async (file: File): Promise<Product[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

  if (rawData.length === 0) return [];

  const headers = Object.keys(rawData[0]);
  
  // Intelligent Mapper
  const findColumn = (keywords: string[]) => {
    // 1. Exact Match (Normalized)
    for (const h of headers) {
        if (keywords.some(k => normalizeStr(h) === normalizeStr(k))) return h;
    }
    // 2. Partial Includes
    for (const h of headers) {
        if (keywords.some(k => normalizeStr(h).includes(normalizeStr(k)))) return h;
    }
    // 3. Fuzzy Match
    let bestH = null;
    let minDiff = 3; // Tolerance
    for (const h of headers) {
        for (const k of keywords) {
            const diff = getLevenshteinDistance(normalizeStr(h), normalizeStr(k));
            if (diff < minDiff) {
                minDiff = diff;
                bestH = h;
            }
        }
    }
    return bestH;
  };

  const map = {
    name: findColumn(['Product Name', 'Item Name', 'Description', 'Particulars', 'Name']),
    batch: findColumn(['Batch', 'Lot', 'Batch No']),
    expiry: findColumn(['Expiry', 'Exp Date', 'Exp']),
    hsn: findColumn(['HSN', 'HSN Code']),
    gst: findColumn(['GST', 'Tax', 'IGST', 'Tax Rate']),
    mrp: findColumn(['MRP', 'Maximum Retail Price']),
    rate: findColumn(['Purchase Rate', 'PTS', 'Cost', 'Rate']),
    saleRate: findColumn(['Sale Rate', 'Selling Price', 'PTR', 'Rate']),
    stock: findColumn(['Stock', 'Qty', 'Quantity', 'Balance', 'Closing Stock']),
    mfg: findColumn(['Mfg', 'Company', 'Manufacturer', 'Brand'])
  };

  return rawData.map(row => {
    // Robust Data Conversion
    const getVal = (col: string | null) => col ? row[col] : null;
    const getNum = (col: string | null) => {
        const v = getVal(col);
        return v ? parseFloat(String(v).replace(/[^\d.]/g, '')) || 0 : 0;
    };

    return {
      name: getVal(map.name) ? String(getVal(map.name)).trim() : 'Unknown Item',
      batch: getVal(map.batch) ? String(getVal(map.batch)).toUpperCase().trim() : 'NA',
      expiry: parseExcelDate(getVal(map.expiry)),
      hsn: getVal(map.hsn) ? String(getVal(map.hsn)) : '',
      gstRate: getNum(map.gst),
      mrp: getNum(map.mrp),
      purchaseRate: getNum(map.rate),
      saleRate: map.saleRate ? getNum(map.saleRate) : getNum(map.rate), // Fallback to purchase rate if sale rate missing
      stock: getNum(map.stock),
      manufacturer: getVal(map.mfg) ? String(getVal(map.mfg)) : 'Generic',
    };
  });
};

const parseExcelDate = (val: any): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel Serial Date
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  // String Date parsing
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
};
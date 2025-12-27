import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Card, Button, Input, Modal } from '../components/UI';
import { Product, InvoiceItem, Party } from '../types';
import { Search, Plus, Trash2, Save, Printer } from 'lucide-react';
import { formatCurrency, getThemeColors } from '../utils';
import { generateInvoicePDF } from '../services/pdfGenerator';
import { useTheme } from '../App';

const Billing = () => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  // Invoice State
  const [billType, setBillType] = useState<'WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [logistics, setLogistics] = useState({ transport: '', vehicleNo: '', grNo: '', destination: '' });

  // Settings for auto-increment invoice no
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  // Search Results
  const productResults = useLiveQuery(async () => {
    if (!searchQuery) return [];
    return db.products.where('name').startsWithIgnoreCase(searchQuery).limit(10).toArray();
  }, [searchQuery]);

  const parties = useLiveQuery(() => db.parties.toArray());

  // Add Item Logic
  const addItem = (product: Product) => {
    const newItem: InvoiceItem = {
      productId: product.id!,
      productName: product.name,
      batch: product.batch,
      expiry: product.expiry,
      hsn: product.hsn,
      qty: 1,
      freeQty: 0,
      mrp: product.mrp,
      rate: product.saleRate,
      discountPercent: 0,
      gstRate: product.gstRate,
      // Init calcs
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0
    };
    calculateRow(newItem);
    setItems([...items, newItem]);
    setSearchQuery('');
  };

  // Row Calculation Logic
  const calculateRow = (item: InvoiceItem) => {
    const gross = item.rate * item.qty;
    const discountAmount = (gross * item.discountPercent) / 100;
    item.taxableValue = gross - discountAmount;
    
    // GST Split (Assuming Intra-state for simplicity, usually depends on State Code)
    const gstAmount = (item.taxableValue * item.gstRate) / 100;
    item.cgstAmount = gstAmount / 2;
    item.sgstAmount = gstAmount / 2;
    item.igstAmount = 0; // Logic can be extended for Inter-state
    
    item.totalAmount = item.taxableValue + gstAmount;
    return item;
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: Number(value) };
    calculateRow(item);
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totals Calculation
  const subTotal = items.reduce((acc, item) => acc + item.taxableValue, 0);
  const totalGst = items.reduce((acc, item) => acc + item.cgstAmount + item.sgstAmount, 0);
  const totalWithGst = subTotal + totalGst;
  const roundOff = Math.round(totalWithGst) - totalWithGst;
  const grandTotal = Math.round(totalWithGst);

  // Save Invoice
  const handleSaveInvoice = async () => {
    if (!selectedParty && billType === 'WHOLESALE') {
        alert('Please select a party');
        return;
    }
    if (items.length === 0) {
        alert('No items in cart');
        return;
    }

    const nextInvNo = `${settings?.invoicePrefix}-${settings?.currentInvoiceNo}`;
    
    const invoiceData = {
        invoiceNo: nextInvNo,
        date: new Date().toISOString(),
        partyId: selectedParty?.id,
        partyName: selectedParty?.name || 'Cash Sale',
        partyAddress: selectedParty?.address || '',
        partyGstin: selectedParty?.gstin || '',
        type: billType,
        logistics,
        items,
        subTotal,
        totalGst,
        roundOff,
        grandTotal
    };

    try {
        await db.invoices.add(invoiceData);
        // Update Stock
        for (const item of items) {
            const product = await db.products.get(item.productId);
            if (product) {
                await db.products.update(item.productId, { 
                    stock: product.stock - (item.qty + item.freeQty) 
                });
            }
        }
        // Increment Invoice No
        if (settings) {
            await db.settings.update(settings.id!, { currentInvoiceNo: settings.currentInvoiceNo + 1 });
        }
        
        // Generate PDF
        if (settings) {
            generateInvoicePDF(invoiceData, settings.profile);
        }
        
        alert('Invoice Saved!');
        // Reset
        setItems([]);
        setSelectedParty(null);
    } catch (e) {
        console.error(e);
        alert('Error saving invoice');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
        {/* Header Control */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-slate-800">
                <button 
                    onClick={() => setBillType('WHOLESALE')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${billType === 'WHOLESALE' ? `${colors.primary} text-white shadow-md` : 'text-gray-500'}`}
                >
                    Wholesale
                </button>
                <button 
                     onClick={() => setBillType('RETAIL')}
                     className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${billType === 'RETAIL' ? `${colors.primary} text-white shadow-md` : 'text-gray-500'}`}
                >
                    Retail (Cash)
                </button>
            </div>
            
            <div className="flex gap-3">
                 <Button variant="outline" onClick={() => setIsPartyModalOpen(true)}>
                     {selectedParty ? selectedParty.name : (billType === 'WHOLESALE' ? 'Select Party' : 'Cash Customer')}
                 </Button>
                 <Button onClick={handleSaveInvoice}>
                     <Save size={18} /> Save & Print
                 </Button>
            </div>
        </div>

        {/* Product Search & Grid */}
        <Card className="flex-1 flex flex-col p-0 overflow-hidden min-h-[500px]">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 relative">
                 <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                     <Input 
                        placeholder="Scan Barcode or Search Product..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                     />
                 </div>
                 {/* Search Dropdown */}
                 {searchQuery && productResults && productResults.length > 0 && (
                     <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-2xl rounded-b-2xl border-x border-b border-gray-100 dark:border-slate-700 z-50 max-h-60 overflow-y-auto">
                         {productResults.map(p => (
                             <div 
                                key={p.id} 
                                onClick={() => addItem(p)}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer border-b border-gray-50 dark:border-slate-800 last:border-0"
                             >
                                 <div className="flex justify-between">
                                     <span className="font-semibold">{p.name}</span>
                                     <span className="text-gray-500 text-sm">Stock: {p.stock}</span>
                                 </div>
                                 <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                     <span>Batch: {p.batch}</span>
                                     <span>Exp: {p.expiry}</span>
                                     <span>MRP: {p.mrp}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="p-3 w-8">#</th>
                            <th className="p-3 w-48">Product</th>
                            <th className="p-3 w-20">Batch</th>
                            <th className="p-3 w-20">Exp</th>
                            <th className="p-3 w-20">Qty</th>
                            <th className="p-3 w-20">Free</th>
                            <th className="p-3 w-24">Rate</th>
                            <th className="p-3 w-20">Disc%</th>
                            <th className="p-3 w-20">GST%</th>
                            <th className="p-3 w-32 text-right">Taxable</th>
                            <th className="p-3 w-32 text-right">Total</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="p-3 text-gray-400">{idx + 1}</td>
                                <td className="p-3 font-medium">{item.productName}</td>
                                <td className="p-3 text-xs">{item.batch}</td>
                                <td className="p-3 text-xs">{item.expiry}</td>
                                <td className="p-3"><input className="w-16 p-1 border rounded bg-transparent" type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} /></td>
                                <td className="p-3"><input className="w-16 p-1 border rounded bg-transparent" type="number" value={item.freeQty} onChange={(e) => updateItem(idx, 'freeQty', e.target.value)} /></td>
                                <td className="p-3"><input className="w-20 p-1 border rounded bg-transparent" type="number" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} /></td>
                                <td className="p-3"><input className="w-16 p-1 border rounded bg-transparent" type="number" value={item.discountPercent} onChange={(e) => updateItem(idx, 'discountPercent', e.target.value)} /></td>
                                <td className="p-3">{item.gstRate}%</td>
                                <td className="p-3 text-right font-mono">{item.taxableValue.toFixed(2)}</td>
                                <td className="p-3 text-right font-mono font-bold">{item.totalAmount.toFixed(2)}</td>
                                <td className="p-3 text-right text-red-500 cursor-pointer" onClick={() => removeItem(idx)}><Trash2 size={16} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Calculation */}
            <div className="p-6 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Logistics Details</h3>
                     <div className="grid grid-cols-2 gap-3">
                         <Input label="Transport" placeholder="e.g. VRL Logistics" value={logistics.transport} onChange={e => setLogistics({...logistics, transport: e.target.value})} />
                         <Input label="Vehicle No" placeholder="MH 04 AB 1234" value={logistics.vehicleNo} onChange={e => setLogistics({...logistics, vehicleNo: e.target.value})} />
                         <Input label="GR No" placeholder="LR-5501" value={logistics.grNo} onChange={e => setLogistics({...logistics, grNo: e.target.value})} />
                     </div>
                 </div>
                 
                 <div className="space-y-3">
                     <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Sub Total</span>
                         <span className="font-mono">{subTotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Total GST</span>
                         <span className="font-mono">{totalGst.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Round Off</span>
                         <span className="font-mono">{roundOff.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200 dark:border-slate-700">
                         <span>Grand Total</span>
                         <span className={colors.text}>{formatCurrency(grandTotal)}</span>
                     </div>
                 </div>
            </div>
        </Card>

        {/* Party Selection Modal */}
        <Modal isOpen={isPartyModalOpen} onClose={() => setIsPartyModalOpen(false)} title="Select Party">
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {parties?.map(party => (
                    <div 
                        key={party.id} 
                        className="p-3 border rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                        onClick={() => { setSelectedParty(party); setIsPartyModalOpen(false); }}
                    >
                        <div>
                            <p className="font-bold">{party.name}</p>
                            <p className="text-xs text-gray-500">{party.address}</p>
                        </div>
                        <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{party.type}</span>
                    </div>
                ))}
            </div>
        </Modal>
    </div>
  );
};

export default Billing;

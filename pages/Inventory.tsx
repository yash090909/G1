import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Card, Button, Input, Modal } from '../components/UI';
import { Search, Plus, Upload, Trash2, Edit2, Zap, BadgeCheck } from 'lucide-react';
import { parseProductsExcel } from '../services/excelService';
import { Product } from '../types';
import { formatCurrency, getThemeColors, cn } from '../utils';
import { useTheme } from '../App';

const Inventory = () => {
  const { theme, isWindows } = useTheme();
  const colors = getThemeColors(theme);
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchMode, setSearchMode] = useState<'FAST' | 'ACCURATE'>('FAST');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- HYBRID SEARCH ENGINE --
  const products = useLiveQuery(async () => {
    if (!search) return db.products.toArray();

    // 1. FAST SEARCH (Index-based)
    // Dexie's startsWithIgnoreCase uses the underlying IDB KeyRange - extremely fast
    const fastResults = await db.products
      .where('name').startsWithIgnoreCase(search)
      .or('batch').startsWithIgnoreCase(search)
      .toArray();

    // 2. ACCURATE SEARCH (Fallback if fast search fails or mode is forced)
    if (searchMode === 'ACCURATE' || (fastResults.length === 0 && search.length > 3)) {
        // Fetch all names (lightweight) then fuzzily match in memory
        // Ideally this runs in a WebWorker for datasets > 10k, but fine here for <5k
        const allProds = await db.products.toArray();
        const lowerSearch = search.toLowerCase();
        
        return allProds.filter(p => {
            const name = p.name.toLowerCase();
            // Fuzzy logic: Name includes search OR Levenshtein distance is low
            if (name.includes(lowerSearch)) return true;
            
            // Simple poor-man's fuzzy: check if 80% of chars match in order
            let matchCount = 0;
            let lastIdx = -1;
            for(const char of lowerSearch) {
                const idx = name.indexOf(char, lastIdx + 1);
                if (idx > -1) {
                    matchCount++;
                    lastIdx = idx;
                }
            }
            return (matchCount / lowerSearch.length) > 0.7;
        });
    }

    return fastResults;
  }, [search, searchMode]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseProductsExcel(file);
      // Bulk add is transactional and faster
      await db.products.bulkAdd(data);
      alert(`Success! Imported ${data.length} products. They are now searchable.`);
    } catch (err) {
      console.error(err);
      alert('Failed to import excel file. Check format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      db.products.delete(id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const productData: any = Object.fromEntries(formData.entries());
    
    // Convert numbers
    ['stock', 'mrp', 'gstRate', 'purchaseRate', 'saleRate'].forEach(key => {
        productData[key] = Number(productData[key]);
    });

    if (editingProduct?.id) {
        await db.products.update(editingProduct.id, productData);
    } else {
        await db.products.add(productData);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={cn("font-bold", isWindows ? "text-xl" : "text-2xl")}>Inventory</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} /> {isImporting ? 'Importing...' : 'Bulk Import'}
          </Button>
          <input type="file" hidden ref={fileInputRef} accept=".xlsx,.csv" onChange={handleImport} />
          
          <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
            <Plus size={18} /> Add
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input 
              placeholder="Search by Product Name or Batch No..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Search Mode Toggle */}
          <button 
             onClick={() => setSearchMode(prev => prev === 'FAST' ? 'ACCURATE' : 'FAST')}
             className={cn(
                 "p-2 rounded-lg border flex items-center gap-2 text-xs font-bold transition-colors",
                 searchMode === 'FAST' 
                    ? "bg-blue-50 text-blue-600 border-blue-200" 
                    : "bg-purple-50 text-purple-600 border-purple-200"
             )}
             title={searchMode === 'FAST' ? "Fast Prefix Match" : "Smart Fuzzy Match"}
          >
              {searchMode === 'FAST' ? <Zap size={16} /> : <BadgeCheck size={16} />}
              <span className="hidden sm:inline">{searchMode}</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium sticky top-0 z-10">
              <tr>
                <th className="p-4">Product Name</th>
                <th className="p-4">Batch</th>
                <th className="p-4">Expiry</th>
                <th className="p-4">Stock</th>
                <th className="p-4">MRP</th>
                <th className="p-4">GST%</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {products?.slice(0, 100).map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-gray-500">{product.batch}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      new Date(product.expiry) < new Date() ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}>
                      {product.expiry}
                    </span>
                  </td>
                  <td className="p-4 font-medium">
                    <span className={product.stock < 50 ? "text-red-500" : ""}>{product.stock}</span>
                  </td>
                  <td className="p-4">{formatCurrency(product.mrp)}</td>
                  <td className="p-4">{product.gstRate}%</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-blue-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id!)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                      <p>No products found.</p>
                      {search && searchMode === 'FAST' && (
                          <button onClick={() => setSearchMode('ACCURATE')} className="text-blue-500 text-xs mt-2 hover:underline">
                              Try Deep Search?
                          </button>
                      )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input name="name" label="Product Name" defaultValue={editingProduct?.name} required />
          <div className="grid grid-cols-2 gap-4">
             <Input name="batch" label="Batch No" defaultValue={editingProduct?.batch} required />
             <Input name="expiry" type="date" label="Expiry Date" defaultValue={editingProduct?.expiry} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input name="hsn" label="HSN Code" defaultValue={editingProduct?.hsn} required />
             <Input name="manufacturer" label="Manufacturer" defaultValue={editingProduct?.manufacturer} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
             <Input name="stock" type="number" label="Stock" defaultValue={editingProduct?.stock} required />
             <Input name="gstRate" type="number" label="GST %" defaultValue={editingProduct?.gstRate} required />
             <Input name="mrp" type="number" label="MRP" defaultValue={editingProduct?.mrp} required step="0.01" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input name="purchaseRate" type="number" label="Purchase Rate" defaultValue={editingProduct?.purchaseRate} required step="0.01" />
             <Input name="saleRate" type="number" label="Sale Rate" defaultValue={editingProduct?.saleRate} required step="0.01" />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
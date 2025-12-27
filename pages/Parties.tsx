import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Card, Button, Input, Modal } from '../components/UI';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Party } from '../types';

const Parties = () => {
  const parties = useLiveQuery(() => db.parties.toArray());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = Object.fromEntries(formData.entries());
    
    if (editingParty?.id) {
        await db.parties.update(editingParty.id, data);
    } else {
        await db.parties.add(data);
    }
    setIsModalOpen(false);
    setEditingParty(null);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Party Management</h1>
            <Button onClick={() => { setEditingParty(null); setIsModalOpen(true); }}>
                <Plus size={18} /> Add Party
            </Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {parties?.map(party => (
               <Card key={party.id} className="relative group">
                   <div className="flex justify-between items-start">
                       <div>
                           <h3 className="font-bold text-lg">{party.name}</h3>
                           <p className="text-sm text-gray-500 mt-1">{party.address}</p>
                       </div>
                       <span className={`px-2 py-1 rounded text-xs font-bold ${party.type === 'WHOLESALE' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                           {party.type}
                       </span>
                   </div>
                   <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                       <p>GSTIN: {party.gstin || 'N/A'}</p>
                       <p>Ph: {party.phone}</p>
                       <p className="text-xs mt-2">DL: {party.dlNo1}, {party.dlNo2}</p>
                   </div>
                   
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                       <button onClick={() => { setEditingParty(party); setIsModalOpen(true); }} className="p-2 bg-white dark:bg-slate-800 shadow rounded-full hover:scale-110 transition-transform">
                           <Edit2 size={14} className="text-blue-500" />
                       </button>
                       <button onClick={() => party.id && db.parties.delete(party.id)} className="p-2 bg-white dark:bg-slate-800 shadow rounded-full hover:scale-110 transition-transform">
                           <Trash2 size={14} className="text-red-500" />
                       </button>
                   </div>
               </Card>
           ))}
       </div>

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingParty ? "Edit Party" : "Add New Party"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" label="Party Name" defaultValue={editingParty?.name} required />
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Type</label>
                        <select name="type" defaultValue={editingParty?.type || 'WHOLESALE'} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2">
                            <option value="WHOLESALE">Wholesale</option>
                            <option value="RETAIL">Retail</option>
                        </select>
                     </div>
                     <Input name="gstin" label="GSTIN" defaultValue={editingParty?.gstin} />
                </div>
                <Input name="address" label="Address" defaultValue={editingParty?.address} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input name="phone" label="Phone" defaultValue={editingParty?.phone} />
                    <Input name="email" label="Email" defaultValue={editingParty?.email} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input name="dlNo1" label="DL No 1 (20B)" defaultValue={editingParty?.dlNo1} />
                    <Input name="dlNo2" label="DL No 2 (21B)" defaultValue={editingParty?.dlNo2} />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Party</Button>
                </div>
            </form>
       </Modal>
    </div>
  );
};

export default Parties;

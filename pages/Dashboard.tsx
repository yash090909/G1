import React, { useEffect, useState } from 'react';
import { Card } from '../components/UI';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingUp, AlertTriangle, Package, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { formatCurrency, getThemeColors } from '../utils';
import { useTheme } from '../App';

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <Card className="flex items-center gap-5 relative overflow-hidden">
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</h3>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  </Card>
);

const Dashboard = () => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [stats, setStats] = useState({
    totalSales: 0,
    invoiceCount: 0,
    lowStock: 0,
    expiringSoon: 0
  });

  const invoices = useLiveQuery(() => db.invoices.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  useEffect(() => {
    if (invoices && products) {
      const totalSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
      const lowStock = products.filter(p => p.stock < 50).length;
      
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      const expiringSoon = products.filter(p => {
        if (!p.expiry) return false;
        return new Date(p.expiry) <= threeMonthsFromNow;
      }).length;

      setStats({
        totalSales,
        invoiceCount: invoices.length,
        lowStock,
        expiringSoon
      });
    }
  }, [invoices, products]);

  // Mock data for charts (in a real app, aggregate from invoices)
  const salesData = [
    { name: 'Jan', sales: 40000 },
    { name: 'Feb', sales: 30000 },
    { name: 'Mar', sales: 20000 },
    { name: 'Apr', sales: 27800 },
    { name: 'May', sales: 18900 },
    { name: 'Jun', sales: 23900 },
    { name: 'Jul', sales: 34900 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalSales)} 
          icon={TrendingUp} 
          color="bg-emerald-500"
          subtext="+12.5% from last month"
        />
        <StatCard 
          title="Invoices Generated" 
          value={stats.invoiceCount} 
          icon={FileText} 
          color="bg-blue-500"
          subtext="Total processed"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats.lowStock} 
          icon={Package} 
          color="bg-orange-500"
          subtext="Items below 50 units"
        />
        <StatCard 
          title="Expiring Soon" 
          value={stats.expiringSoon} 
          icon={AlertTriangle} 
          color="bg-red-500"
          subtext="Next 3 Months"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[400px]">
          <h3 className="text-lg font-bold mb-6">Sales Trends</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="sales" fill={colors.primary.replace('bg-', 'var(--color-')} radius={[4, 4, 0, 0]} barSize={40} className={`fill-current ${colors.text}`} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-[400px]">
          <h3 className="text-lg font-bold mb-6">Revenue Analytics</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="sales" strokeWidth={3} stroke="#8b5cf6" dot={{ r: 4, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Card, Button, Input } from '../components/UI';
import { ThemeColor, PlatformMode } from '../types';
import { useTheme } from '../App';
import { getThemeColors } from '../utils';
import { Monitor, Smartphone, Cpu } from 'lucide-react';

const Settings = () => {
  const { setTheme, setPlatform, platform } = useTheme();
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = Object.fromEntries(formData.entries());
    
    // Nested profile object update manually for simplicity in this flat form
    const newSettings = {
        ...settings,
        theme: data.theme,
        platform: data.platform, // Save platform preference
        invoicePrefix: data.invoicePrefix,
        profile: {
            name: data.name,
            address: data.address,
            gstin: data.gstin,
            phone: data.phone,
            email: data.email,
            dlNo1: data.dlNo1,
            dlNo2: data.dlNo2,
            terms: data.terms
        }
    };
    
    await db.settings.put(newSettings);
    setTheme(data.theme);
    setPlatform(data.platform);
    alert('Settings Updated');
  };

  if (!settings) return <div>Loading...</div>;

  const ThemeOption = ({ color, value }: { color: string, value: ThemeColor }) => {
    const isSelected = settings.theme === value;
    const colors = getThemeColors(value);
    return (
        <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${isSelected ? `border-${value}-500 bg-${value}-50` : 'border-transparent bg-white dark:bg-slate-800'}`}>
            <input type="radio" name="theme" value={value} defaultChecked={isSelected} className="hidden" />
            <div className={`w-12 h-12 rounded-full ${colors.primary} shadow-lg mb-2`} />
            <span className="font-medium capitalize">{value}</span>
        </label>
    )
  };

  const PlatformOption = ({ mode, icon: Icon, label }: { mode: PlatformMode, icon: any, label: string }) => {
      const isSelected = (settings.platform || 'AUTO') === mode;
      return (
        <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${isSelected ? `border-blue-500 bg-blue-50` : 'border-transparent bg-white dark:bg-slate-800'}`}>
            <input type="radio" name="platform" value={mode} defaultChecked={isSelected} className="hidden" />
            <Icon size={32} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
            <span className="font-medium capitalize">{label}</span>
        </label>
      );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
        <h1 className="text-2xl font-bold">Settings</h1>
        <form onSubmit={handleSave} className="space-y-8">
            
            {/* OS / Platform Settings */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Operating System Mode</h3>
                <div className="grid grid-cols-3 gap-4">
                    <PlatformOption mode="AUTO" icon={Cpu} label="Auto Detect" />
                    <PlatformOption mode="WINDOWS" icon={Monitor} label="Windows 11" />
                    <PlatformOption mode="ANDROID" icon={Smartphone} label="Android" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Forces the layout to behave like a native app for the selected OS.</p>
            </section>

            <section>
                <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ThemeOption color="blue" value="ocean" />
                    <ThemeOption color="green" value="nature" />
                    <ThemeOption color="purple" value="royal" />
                    <ThemeOption color="slate" value="midnight" />
                </div>
            </section>

            <section>
                <h3 className="text-lg font-semibold mb-4">Company Profile</h3>
                <Card className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="name" label="Company Name" defaultValue={settings.profile.name} className="md:col-span-2" />
                    <Input name="address" label="Address" defaultValue={settings.profile.address} className="md:col-span-2" />
                    <Input name="gstin" label="GSTIN" defaultValue={settings.profile.gstin} />
                    <Input name="phone" label="Phone" defaultValue={settings.profile.phone} />
                    <Input name="email" label="Email" defaultValue={settings.profile.email} />
                    <Input name="invoicePrefix" label="Invoice Prefix" defaultValue={settings.invoicePrefix} />
                    <Input name="dlNo1" label="DL No 1 (20B)" defaultValue={settings.profile.dlNo1} />
                    <Input name="dlNo2" label="DL No 2 (21B)" defaultValue={settings.profile.dlNo2} />
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Terms & Conditions</label>
                         <textarea name="terms" defaultValue={settings.profile.terms} rows={4} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2" />
                    </div>
                </Card>
            </section>

            <div className="flex justify-end">
                <Button type="submit" className="px-8">Save Changes</Button>
            </div>
        </form>
    </div>
  );
};

export default Settings;
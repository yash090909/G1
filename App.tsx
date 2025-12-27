import React, { createContext, useContext, useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Parties from './pages/Parties';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import { ThemeColor, PlatformMode } from './types';
import { db } from './db';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

// Theme & Platform Context
interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  platform: PlatformMode;
  setPlatform: (mode: PlatformMode) => void;
  isWindows: boolean;
}
const ThemeContext = createContext<ThemeContextType>({ 
    theme: 'ocean', 
    setTheme: () => {}, 
    platform: 'AUTO', 
    setPlatform: () => {},
    isWindows: false
});
export const useTheme = () => useContext(ThemeContext);

const App = () => {
  const [theme, setTheme] = useState<ThemeColor>('ocean');
  const [platform, setPlatform] = useState<PlatformMode>('AUTO');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    // Load settings from DB
    db.settings.toCollection().first().then(s => {
      if (s) {
          setTheme(s.theme);
          setPlatform(s.platform || 'AUTO');
      }
    });
  }, []);

  // Determine OS Mode logic
  useEffect(() => {
      if (platform === 'WINDOWS') {
          setIsWindows(true);
      } else if (platform === 'ANDROID') {
          setIsWindows(false);
      } else {
          // AUTO detect
          const ua = navigator.userAgent.toLowerCase();
          setIsWindows(ua.includes('windows'));
      }
  }, [platform]);

  // Update body class for dark mode if midnight theme
  useEffect(() => {
    if (theme === 'midnight') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, platform, setPlatform, isWindows }}>
      <HashRouter>
        <div className={clsx(
            "flex h-screen overflow-hidden font-sans transition-colors duration-300",
            theme,
            // Conditional Backgrounds for OS feel
            isWindows ? "bg-[#f3f3f3] dark:bg-[#202020] text-gray-900 dark:text-gray-100" : "bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100"
        )}>
          <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Header only for Mobile/Android view usually, or when sidebar is collapsed */}
            <header className={clsx(
                "flex items-center lg:hidden p-4 z-20",
                isWindows ? "bg-white/50 backdrop-blur-md border-b border-gray-200" : "bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800"
            )}>
              <button onClick={() => setSidebarOpen(true)} className="p-2">
                <Menu />
              </button>
              <span className="font-bold ml-3">Gopi Distributors</span>
            </header>

            <div className={clsx(
                "flex-1 overflow-auto scroll-smooth",
                isWindows ? "p-4 lg:p-6" : "p-4 pb-24 lg:p-8" // Android needs padding for bottom nav
            )}>
               <Routes>
                 <Route path="/" element={<Dashboard />} />
                 <Route path="/inventory" element={<Inventory />} />
                 <Route path="/parties" element={<Parties />} />
                 <Route path="/billing" element={<Billing />} />
                 <Route path="/settings" element={<Settings />} />
               </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </ThemeContext.Provider>
  );
};

export default App;
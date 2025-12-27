import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Receipt, Settings, LogOut, Menu } from 'lucide-react';
import { cn, getThemeColors } from '../utils';
import { useTheme } from '../App';

// Shared Links config
const LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/parties', icon: Users, label: 'Parties' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const { theme, isWindows } = useTheme();
  const colors = getThemeColors(theme);

  if (isWindows) {
    // -- WINDOWS 11 STYLE SIDEBAR --
    return (
      <aside className="hidden lg:flex flex-col h-full w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-slate-800 z-30">
        <div className="p-6 flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-lg shadow-sm", colors.primary)}>
            G
          </div>
          <span className="font-semibold text-lg tracking-tight">Gopi Dist</span>
        </div>

        <nav className="px-2 space-y-1 flex-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-sm font-medium",
                isActive 
                  ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              )}
            >
              {({ isActive }) => (
                <>
                  <link.icon size={18} strokeWidth={2} className={isActive ? colors.text : "text-gray-500"} />
                  {link.label}
                  {isActive && <div className={cn("ml-auto w-1 h-4 rounded-full", colors.primary)} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    );
  }

  // -- ANDROID / MOBILE STYLE --
  return (
    <>
      {/* Mobile Sidebar (Drawer) */}
      <aside className={cn(
        "fixed lg:static top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-30 transition-transform duration-300 lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Android Drawer Content */}
        <div className="p-8">
           <h1 className="text-2xl font-bold mb-8">Menu</h1>
           <nav className="space-y-4">
            {LINKS.map(link => (
              <NavLink key={link.to} to={link.to} onClick={toggle} className={({isActive}) => cn(
                 "flex items-center gap-4 text-lg font-medium",
                 isActive ? colors.text : "text-gray-500"
              )}>
                 <link.icon size={24} /> {link.label}
              </NavLink>
            ))}
           </nav>
        </div>
      </aside>
      
      {/* Dark Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={toggle} />}

      {/* Android Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 lg:flex lg:w-24 lg:flex-col lg:border-r lg:border-t-0 lg:h-full lg:static z-50 pb-safe">
        <nav className="flex lg:flex-col justify-around lg:justify-start lg:gap-8 lg:pt-8 items-center h-20 lg:h-auto px-2">
           <div className="hidden lg:flex w-12 h-12 mb-4 items-center justify-center font-bold text-xl bg-gray-100 dark:bg-slate-800 rounded-xl">G</div>
           
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center w-full lg:w-auto gap-1 transition-all duration-200 active:scale-95",
                isActive ? colors.text : "text-gray-400 dark:text-gray-500"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "w-16 h-8 lg:w-12 lg:h-12 rounded-full lg:rounded-2xl flex items-center justify-center transition-colors",
                    isActive ? colors.primaryLight : "bg-transparent hover:bg-gray-50 dark:hover:bg-slate-900"
                  )}>
                     <link.icon size={24} strokeWidth={2} className={cn(
                       isActive ? "text-gray-900" : "text-current"
                     )} />
                  </div>
                  <span className="text-[10px] font-medium tracking-wide lg:hidden">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 z-40 px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm", colors.primary)}>G</div>
            <span className="font-bold text-lg">Gopi Dist</span>
         </div>
      </div>
    </>
  );
};

export default Sidebar;
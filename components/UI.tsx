import React from 'react';
import { cn, getThemeColors } from '../utils';
import { useTheme } from '../App';
import { X } from 'lucide-react';

// -- Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  const { isWindows } = useTheme();
  
  return (
    <div 
      className={cn(
        "bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800",
        isWindows ? "rounded-lg" : "rounded-3xl", // Win11: smaller radius, Android: large
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

// -- Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}
export const Button = ({ children, className, variant = 'primary', ...props }: ButtonProps) => {
  const { theme, isWindows } = useTheme();
  const colors = getThemeColors(theme);

  const variants = {
    primary: cn(colors.primary, "text-white shadow-lg hover:shadow-xl hover:brightness-110 border-transparent"),
    secondary: "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700 border-transparent",
    outline: cn("bg-transparent border-2", colors.border, colors.text, "hover:bg-gray-50 dark:hover:bg-slate-900"),
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 border-transparent",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-transparent"
  };

  return (
    <button 
      className={cn(
        "font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 border disabled:opacity-50 disabled:pointer-events-none",
        isWindows ? "rounded-md px-4 py-1.5 text-sm" : "rounded-xl px-5 py-3", // Win11: Compact, Android: Touch-friendly
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// -- Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, className, error, ...props }, ref) => {
  const { theme, isWindows } = useTheme();
  const colors = getThemeColors(theme);
  
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "w-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 border focus:outline-none focus:ring-2 transition-all",
          isWindows ? "rounded-md px-3 py-2 text-sm" : "rounded-xl px-4 py-3", // Adaptive size
          colors.ring,
          error && "border-red-500 focus:ring-red-200",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
});

// -- Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const { isWindows } = useTheme();

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200",
        isWindows ? "rounded-xl border border-gray-200 dark:border-slate-700" : "rounded-[2rem]"
      )}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
          <h2 className={cn("font-bold", isWindows ? "text-lg" : "text-xl")}>{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
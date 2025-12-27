import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  let numStr = num.toString().replace(/[\, ]/g, '');
  if (parseFloat(numStr).toString() !== numStr && parseFloat(numStr) !== num) return 'Not a Number'; // Basic check
  
  let n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : 'only';
  return str;
};

// Theme helper
export const getThemeColors = (theme: string) => {
  switch (theme) {
    case 'nature':
      return {
        primary: 'bg-nature-500',
        primaryHover: 'hover:bg-nature-600',
        primaryLight: 'bg-nature-50',
        text: 'text-nature-600',
        border: 'border-nature-500',
        ring: 'focus:ring-nature-500'
      };
    case 'royal':
      return {
        primary: 'bg-royal-500',
        primaryHover: 'hover:bg-royal-600',
        primaryLight: 'bg-royal-50',
        text: 'text-royal-600',
        border: 'border-royal-500',
        ring: 'focus:ring-royal-500'
      };
    case 'midnight':
      return {
        primary: 'bg-slate-700',
        primaryHover: 'hover:bg-slate-600',
        primaryLight: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-600',
        ring: 'focus:ring-slate-500'
      };
    case 'ocean':
    default:
      return {
        primary: 'bg-ocean-500',
        primaryHover: 'hover:bg-ocean-600',
        primaryLight: 'bg-ocean-50',
        text: 'text-ocean-600',
        border: 'border-ocean-500',
        ring: 'focus:ring-ocean-500'
      };
  }
};
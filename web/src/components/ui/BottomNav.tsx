'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, RotateCcw, BarChart2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const navItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Registrar',
    href: '/dashboard/registrar',
    icon: PlusCircle,
  },
  {
    label: 'Revisar',
    href: '/dashboard/revisar',
    icon: RotateCcw,
  },
  {
    label: 'Stats',
    href: '/dashboard/stats',
    icon: BarChart2,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-3 pb-8 md:hidden z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 group transition-all duration-300 relative px-2 py-1",
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-300",
                isActive ? "bg-blue-50 scale-110 shadow-sm" : "group-hover:bg-gray-50 group-active:scale-95"
              )}>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform group-active:scale-90" 
                />
              </div>
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wider transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -top-[13px] w-8 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all animate-in fade-in zoom-in slide-in-from-top-1" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

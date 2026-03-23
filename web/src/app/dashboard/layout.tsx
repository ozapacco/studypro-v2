import React from 'react';
import { BottomNav } from '@/components/ui/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
      
      {/* Mobile Navigation */}
      <BottomNav />
      
      {/* Desktop sidebar could go here in future */}
    </div>
  );
}

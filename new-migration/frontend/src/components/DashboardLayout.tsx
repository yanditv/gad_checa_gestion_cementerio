'use client';

import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: LayoutProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const loader = document.querySelector('.loader-bg') as HTMLElement | null;
      if (loader) {
        loader.style.display = 'none';
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      <Sidebar />
      <Header userName="Administrador" userRole="Admin" />
      <main className="pc-container">
        <div className="pc-content">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

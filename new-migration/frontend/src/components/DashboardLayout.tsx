'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export interface SessionUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
}

export function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/auth/');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apaga el loader inicial del template Able Pro tras 500ms (paridad legado).
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const loader = document.querySelector('.loader-bg') as HTMLElement | null;
      if (loader) loader.style.display = 'none';
    }, 500);
    return () => window.clearTimeout(timeout);
  }, []);

  // Carga datos de sesión para Header y Sidebar.
  useEffect(() => {
    if (isAuthRoute) {
      setUser(null);
      return;
    }
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled) return;
        if (payload?.data) setUser(payload.data as SessionUser);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthRoute, pathname]);

  // Cierra el sidebar móvil al cambiar de ruta.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header
        user={user}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

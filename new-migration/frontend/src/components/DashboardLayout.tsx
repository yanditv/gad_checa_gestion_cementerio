'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

interface SessionUser {
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
}

export function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/auth/');
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const loader = document.querySelector('.loader-bg') as HTMLElement | null;
      if (loader) loader.style.display = 'none';
    }, 500);
    return () => window.clearTimeout(timeout);
  }, []);

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

  if (isAuthRoute) {
    return <>{children}</>;
  }

  const displayName = user ? `${user.nombre} ${user.apellido}`.trim() : 'Usuario';
  const role = user?.roles?.[0] ?? '';

  return (
    <>
      <Sidebar />
      <Header userName={displayName} userRole={role} />
      <main className="pc-container">
        <div className="pc-content">{children}</div>
      </main>
      <Footer />
    </>
  );
}

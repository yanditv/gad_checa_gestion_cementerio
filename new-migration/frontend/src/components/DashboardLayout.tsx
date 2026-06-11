'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  mustChangePassword?: boolean;
}

export function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname?.startsWith('/auth/');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        if (payload?.data) {
          const session = payload.data as SessionUser;
          setUser(session);
          // Si el admin reseteó la contraseña, fuerza el cambio antes de
          // permitir navegar por cualquier otra ruta del sistema.
          if (session.mustChangePassword) {
            router.replace('/auth/change-password');
          }
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthRoute, pathname, router]);

  // Cierra el sidebar móvil al cambiar de ruta.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-700">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header
        user={user}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* Columna flex de alto mínimo viewport: el contenido empuja y el
          footer queda anclado abajo aunque la página tenga poco contenido. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-screen flex-col pt-16 focus:outline-none lg:ml-64"
      >
        <div className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

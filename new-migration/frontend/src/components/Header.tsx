'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { SessionUser } from './DashboardLayout';

interface HeaderProps {
  user: SessionUser | null;
  onToggleSidebar: () => void;
}

export function Header({ user, onToggleSidebar }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer click fuera.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      /* ignoramos */
    }
    window.location.href = '/auth/login';
  };

  const displayName = user
    ? `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || 'Usuario'
    : 'Usuario';
  const initials = displayName
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  const role = user?.roles?.[0] ?? '';

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur lg:left-64">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        {/* Toggle sidebar móvil */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <i className="ti ti-menu-2 text-xl" />
        </button>

        {/* Buscador (placeholder global, conectaremos al backend en fase posterior) */}
        <div className="hidden flex-1 max-w-md md:block">
          <div className="relative">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar contratos, personas, bóvedas…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-1" ref={dropdownRef}>
          {/* Notificaciones */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowUserMenu(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Notificaciones"
            >
              <i className="ti ti-bell text-xl" />
              {/* Punto de notificaciones — futuro: badge dinámico */}
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lifted">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="font-semibold text-slate-700">
                    Notificaciones
                  </span>
                  <button
                    type="button"
                    className="text-xs text-primary-600 hover:underline"
                    onClick={() => setShowNotifications(false)}
                  >
                    Cerrar
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <div className="px-4 py-8 text-center text-sm text-slate-400">
                    No hay notificaciones nuevas.
                  </div>
                </div>
                <Link
                  href="/notify"
                  className="block border-t border-slate-100 px-4 py-2 text-center text-xs font-medium text-primary-600 hover:bg-slate-50"
                  onClick={() => setShowNotifications(false)}
                >
                  Ver todas
                </Link>
              </div>
            )}
          </div>

          {/* Usuario */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu((v) => !v);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                {initials || 'U'}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-semibold text-slate-700">
                  {displayName}
                </div>
                {role && (
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {role}
                  </div>
                )}
              </div>
              <i className="ti ti-chevron-down hidden text-slate-400 sm:block" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lifted">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                    {initials || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-700">
                      {displayName}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {user?.email ?? ''}
                    </div>
                  </div>
                </div>
                <ul className="py-1 text-sm">
                  <li>
                    <Link
                      href="/cuenta"
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="ti ti-user text-slate-400" /> Perfil
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/configuracion"
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="ti ti-settings text-slate-400" />{' '}
                      Configuración
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cuenta"
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="ti ti-lock text-slate-400" /> Cambiar
                      contraseña
                    </Link>
                  </li>
                  <li className="border-t border-slate-100">
                    <a
                      href="#"
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-danger-600 hover:bg-danger-50"
                    >
                      <i className="ti ti-power" />
                      {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

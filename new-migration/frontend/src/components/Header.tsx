'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { SessionUser } from './DashboardLayout';
import { notificacionesApi } from '@/lib/api';
import { timeAgo } from '@/lib/timeago';

interface NotificacionItem {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  entidadTipo?: string;
  entidadId?: number;
}

interface HeaderProps {
  user: SessionUser | null;
  onToggleSidebar: () => void;
}

export function Header({ user, onToggleSidebar }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones no leídas para el badge
  useEffect(() => {
    let cancelled = false;
    notificacionesApi.findPage({ limit: 5, leida: false })
      .then((result) => {
        if (cancelled) return;
        setNotificaciones(result.data ?? []);
        setUnreadCount(result.meta?.total ?? 0);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

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

  const handleMarkRead = async (id: number) => {
    try {
      await notificacionesApi.markRead(id);
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignorar
    }
  };

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
  const avatarSrc = '/images/user/avatar-2.jpg';

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
        <div className="hidden w-full max-w-md md:block lg:max-w-xl">
          <div className="relative">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Buscar contratos, personas y bóvedas"
              placeholder="Buscar contratos, personas, bóvedas…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        <div className="ml-auto flex items-center gap-1" ref={dropdownRef}>
          {/* Notificaciones */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowUserMenu(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border-0 bg-transparent text-slate-500 outline-none ring-0 hover:bg-slate-100 focus:outline-none focus:ring-0"
              aria-label="Notificaciones"
            >
              <i className="ti ti-bell text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lifted">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="font-semibold text-slate-700">
                    Notificaciones
                    {unreadCount > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">
                        ({unreadCount} sin leer)
                      </span>
                    )}
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
                  {notificaciones.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      No hay notificaciones nuevas.
                    </div>
                  ) : (
                    <ul>
                      {notificaciones.map((n) => (
                        <li
                          key={n.id}
                          className={`border-b border-slate-50 px-4 py-2.5 ${
                            !n.leida ? 'bg-primary-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 truncate">
                                {n.titulo}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                                {n.mensaje}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                {timeAgo(n.fechaCreacion)}
                              </p>
                            </div>
                            {!n.leida && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkRead(n.id);
                                }}
                                className="shrink-0 rounded-full p-1 text-primary-500 hover:bg-primary-50"
                                title="Marcar como leída"
                              >
                                <i className="ti ti-check text-xs" />
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
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
              className="flex items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 outline-none ring-0 hover:bg-slate-100 focus:outline-none focus:ring-0"
            >
              <img
                src={avatarSrc}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
              />
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
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
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

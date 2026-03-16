'use client';

import { useState } from 'react';

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export function Header({ userName = 'Usuario', userRole = 'Usuario' }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="pc-header">
      <div className="header-wrapper">
        <div className="me-auto pc-mob-drp">
          <ul className="list-unstyled mb-0 d-flex align-items-center">
            <li className="pc-h-item pc-sidebar-collapse">
              <a href="#" className="pc-head-link ms-0" id="sidebar-hide" aria-label="Ocultar menú">
                <i className="ti ti-menu-2"></i>
              </a>
            </li>
            <li className="pc-h-item pc-sidebar-popup">
              <a href="#" className="pc-head-link ms-0" id="mobile-collapse" aria-label="Abrir menú móvil">
                <i className="ti ti-menu-2"></i>
              </a>
            </li>
          </ul>
        </div>

        <div className="ms-auto">
          <ul className="list-unstyled mb-0 d-flex align-items-center">
            <li className="dropdown pc-h-item">
              <a
                href="#"
                className="pc-head-link dropdown-toggle arrow-none me-0"
                onClick={(e) => {
                  e.preventDefault();
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
              >
                <i className="ti ti-mail"></i>
              </a>
            {showNotifications && (
              <div className="dropdown-menu dropdown-notification dropdown-menu-end pc-h-dropdown show">
                <div className="dropdown-header d-flex align-items-center justify-content-between">
                  <h5 className="m-0">Notificaciones</h5>
                  <a href="#" className="pc-head-link bg-transparent">
                    <i className="ti ti-x text-danger"></i>
                  </a>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-header px-0 text-wrap header-notification-scroll position-relative">
                  <div className="list-group list-group-flush w-100">
                    <div className="dropdown-item">No hay notificaciones nuevas</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="text-center py-2">
                  <a href="/manual" className="link-primary">ver todos</a>
                </div>
              </div>
            )}
            </li>

            <li className="dropdown pc-h-item header-user-profile">
              <a
                href="#"
                className="pc-head-link dropdown-toggle arrow-none me-0"
                onClick={(e) => {
                  e.preventDefault();
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
              >
                <img src="/images/user/avatar-2.jpg" alt="user-image" className="user-avtar" />
                <span>{userName}</span>
              </a>
            {showUserMenu && (
              <div className="dropdown-menu dropdown-user-profile dropdown-menu-end pc-h-dropdown show">
                <div className="dropdown-header">
                  <div className="d-flex mb-1">
                    <div className="flex-shrink-0">
                      <img src="/images/user/avatar-2.jpg" alt="user-image" className="user-avtar wid-35" />
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-1">{userName}</h6>
                      <span>{userRole}</span>
                    </div>
                    <a className="pc-head-link bg-transparent" href="#">
                      <i className="ti ti-power text-danger"></i>
                    </a>
                  </div>
                </div>
                <a href="/cuenta" className="dropdown-item">
                  <i className="ti ti-user"></i>
                  <span>Perfil</span>
                </a>
                <a href="/configuracion" className="dropdown-item">
                  <i className="ti ti-settings"></i>
                  <span>Configuración</span>
                </a>
                <a href="/cuenta" className="dropdown-item">
                  <i className="ti ti-lock"></i>
                  <span>Cambiar Contraseña</span>
                </a>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" style={{ color: '#ef4444' }}>
                  <i className="ti ti-power"></i>
                  <span>Cerrar Sesión</span>
                </div>
              </div>
            )}
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

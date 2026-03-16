export function Footer() {
  return (
    <footer className="pc-footer">
      <div className="footer-wrapper container-fluid">
        <div className="row align-items-center justify-content-between">
          <div className="col-lg-4 col-md-6 mb-2 mb-md-0">
            <div className="d-flex align-items-center">
              <div>
                <h6 className="mb-0 text-primary fw-semibold">GAD Parroquial de Checa</h6>
                <small className="text-muted">Sistema de Gestión de Cementerio</small>
              </div>
            </div>
          </div>

          <div className="col-lg-4 col-md-6 mb-2 mb-md-0">
            <div className="d-flex justify-content-center">
              <div className="d-flex align-items-center me-3">
                <div className="avatar avatar-xs bg-success-subtle rounded-circle me-2">
                  <i className="ti ti-check text-success"></i>
                </div>
                <small className="text-muted">Sistema Activo</small>
              </div>
              <div className="d-flex align-items-center me-3">
                <div className="avatar avatar-xs bg-info-subtle rounded-circle me-2">
                  <i className="ti ti-database text-info"></i>
                </div>
                <small className="text-muted">Base de Datos</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="avatar avatar-xs bg-warning-subtle rounded-circle me-2">
                  <i className="ti ti-shield-check text-warning"></i>
                </div>
                <small className="text-muted">Seguro</small>
              </div>
            </div>
          </div>

          <div className="col-lg-4 col-md-12">
            <div className="d-flex justify-content-end align-items-center">
              <div className="me-3">
                <small className="text-muted">Desarrollado por</small>
                <a
                  href="https://teobu.com"
                  target="_blank"
                  className="badge bg-primary-subtle text-primary text-decoration-none ms-1"
                >
                  Teobu <i className="ti ti-external-link ms-1"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="badge bg-success-subtle text-success me-2">
                  <i className="ti ti-circle-check me-1"></i>Conectado
                </span>
                <small className="text-muted">Sistema operativo</small>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge bg-light-secondary text-secondary me-2">v1.0.0</span>
                <small className="text-muted">© 2024 GAD Checa</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

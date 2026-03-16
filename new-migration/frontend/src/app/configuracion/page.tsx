export default function ConfiguracionPage() {
  return (
    <div>
      <div className="page-header">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Configuración</h2>
        <p className="text-muted mb-0 small">Parámetros generales del sistema</p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted">
            Esta sección está preparada en frontend para continuar con la migración de parámetros institucionales
            (datos del cementerio, ajustes de contratos, plantillas y notificaciones).
          </p>
        </div>
      </div>
    </div>
  );
}

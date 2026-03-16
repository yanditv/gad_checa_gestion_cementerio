import Link from 'next/link';

export default function ManualPage() {
  return (
    <div>
      <div className="page-header">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Manual de Usuario</h2>
        <p className="text-muted mb-0 small">Guía funcional del sistema de gestión del cementerio</p>
      </div>

      <div className="card">
        <div className="card-body">
          <p>
            El manual histórico del sistema original está disponible en el repositorio legado. Puedes consultarlo en:
          </p>
          <Link href="/reportes" className="btn btn-primary">
            Ir al sistema
          </Link>
        </div>
      </div>
    </div>
  );
}

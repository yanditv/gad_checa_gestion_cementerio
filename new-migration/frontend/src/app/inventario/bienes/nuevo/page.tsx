'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Check,
  ClipboardList,
  CircleDollarSign,
  Clock,
  Info,
  Package,
  Plus,
  Receipt,
  Tag,
  UserCheck,
} from 'lucide-react';
import {
  inventarioBienesApi,
  inventarioCategoriasApi,
  inventarioCustodiosApi,
} from '@/lib/api';
import {
  Button,
  Card,
  DatePicker,
  FormSection,
  ImageUpload,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { CategoriaFormModal } from '@/app/inventario/categorias/CategoriaFormModal';
import { CustodioFormModal } from '@/app/inventario/custodios/CustodioFormModal';

const ESTADOS_CONSERVACION = [
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
  { value: 'malo', label: 'Malo' },
];

interface FormState {
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  serie: string;
  fechaAdquisicion: string;
  valorAdquisicion: string;
  fuenteFinanciamiento: string;
  estadoConservacion: string;
  ubicacion: string;
  valorResidual: string;
  vidaUtilMesesOverride: string;
  categoriaId: string;
  custodioId: string;
}

const INITIAL: FormState = {
  codigo: '',
  descripcion: '',
  marca: '',
  modelo: '',
  serie: '',
  fechaAdquisicion: '',
  valorAdquisicion: '',
  fuenteFinanciamiento: '',
  estadoConservacion: 'bueno',
  ubicacion: '',
  valorResidual: '',
  vidaUtilMesesOverride: '',
  categoriaId: '',
  custodioId: '',
};

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

export default function NuevoBienPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>(INITIAL);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [custodios, setCustodios] = useState<{ id: number; nombre: string }[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const categoriaSeleccionada = categorias.find((c) => c.id === Number(formData.categoriaId));
  const custodioSeleccionado = custodios.find((c) => c.id === Number(formData.custodioId));

  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showCustodioModal, setShowCustodioModal] = useState(false);

  const recargarCategorias = async (nuevoId?: number) => {
    try {
      const rows = await inventarioCategoriasApi.findAll();
      setCategorias(rows ?? []);
      if (nuevoId) set('categoriaId', String(nuevoId));
    } catch { /* no-op */ }
  };

  const recargarCustodios = async (nuevoId?: number) => {
    try {
      const rows = await inventarioCustodiosApi.findAll();
      setCustodios(rows ?? []);
      if (nuevoId) set('custodioId', String(nuevoId));
    } catch { /* no-op */ }
  };

  useEffect(() => {
    inventarioCategoriasApi
      .findAll()
      .then((rows) => setCategorias(rows ?? []))
      .catch(() => undefined);
    inventarioCustodiosApi
      .findAll()
      .then((rows) => setCustodios(rows ?? []))
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoriaId) {
      setError('Debe seleccionar una categoría.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const creado = await inventarioBienesApi.create({
        codigo: toOptional(formData.codigo),
        descripcion: formData.descripcion.trim(),
        marca: toOptional(formData.marca),
        modelo: toOptional(formData.modelo),
        serie: toOptional(formData.serie),
        fechaAdquisicion: formData.fechaAdquisicion,
        valorAdquisicion: Number(formData.valorAdquisicion),
        fuenteFinanciamiento: toOptional(formData.fuenteFinanciamiento),
        estadoConservacion: formData.estadoConservacion,
        ubicacion: toOptional(formData.ubicacion),
        valorResidual: formData.valorResidual.trim()
          ? Number(formData.valorResidual)
          : undefined,
        vidaUtilMesesOverride: formData.vidaUtilMesesOverride.trim()
          ? Number(formData.vidaUtilMesesOverride)
          : undefined,
        categoriaId: Number(formData.categoriaId),
        custodioId: formData.custodioId ? Number(formData.custodioId) : undefined,
      });
      // El bien ya quedó creado; la foto es opcional y tolerante a fallos.
      if (fotoFile && creado?.id) {
        try {
          await inventarioBienesApi.uploadFoto(creado.id, fotoFile);
        } catch {
          /* no-op: el bien se creó; la foto puede subirse luego desde la ficha */
        }
      }
      router.push('/inventario/bienes');
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar el bien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nuevo bien"
        subtitle="Registrar (dar de alta) un bien institucional en el inventario."
        backHref="/inventario/bienes"
        icon={<Package className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
      />

      <div className="grid grid-cols-1 gap-6">
        <Card
          padding="none"
          header={<Card.Title icon={<ClipboardList className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>Datos del bien</Card.Title>}
        >
          <form onSubmit={handleSubmit} className="space-y-6 px-5">
            {error && (
              <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-inset ring-danger-200">
                {error}
              </div>
            )}
            <FormSection divided={false}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ImageUpload
                  shape="square"
                  label="Foto (opcional)"
                  hint="JPG, PNG o WEBP, máx. 5 MB"
                  onChange={setFotoFile}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                  <Input
                    label="Código (placa)"
                    value={formData.codigo}
                    onChange={(e) => set('codigo', e.target.value)}
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select
                        label="Categoría"
                        required
                        value={formData.categoriaId}
                        onChange={(e) => set('categoriaId', e.target.value)}
                      >
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setShowCategoriaModal(true)}
                      leftIcon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
                    />
                  </div>
                </div>

                <Input
                  label="Descripción"
                  required
                  value={formData.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      label="Custodio"
                      value={formData.custodioId}
                      onChange={(e) => set('custodioId', e.target.value)}
                    >
                      <option value="">Sin custodio</option>
                      {custodios.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setShowCustodioModal(true)}
                    leftIcon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
                    className="shrink-0"
                  />
                </div>
                <Input
                  label="Marca"
                  value={formData.marca}
                  onChange={(e) => set('marca', e.target.value)}
                />
                <Input
                  label="Modelo"
                  value={formData.modelo}
                  onChange={(e) => set('modelo', e.target.value)}
                />
                <Input
                  label="Serie"
                  value={formData.serie}
                  onChange={(e) => set('serie', e.target.value)}
                />
                <Select
                  label="Estado de conservación"
                  value={formData.estadoConservacion}
                  onChange={(e) => set('estadoConservacion', e.target.value)}
                  options={ESTADOS_CONSERVACION}
                />
              </div>
            </FormSection>
            <FormSection
              title="Adquisición y depreciación"
              icon={<Receipt className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePicker
                  label="Fecha de adquisición"
                  required
                  value={formData.fechaAdquisicion}
                  onChange={(v) => set('fechaAdquisicion', v)}
                />
                <Input
                  label="Valor de adquisición"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorAdquisicion}
                  onChange={(e) => set('valorAdquisicion', e.target.value)}
                />
                <Input
                  label="Fuente de financiamiento"
                  value={formData.fuenteFinanciamiento}
                  onChange={(e) => set('fuenteFinanciamiento', e.target.value)}
                />
                <Input
                  label="Ubicación"
                  value={formData.ubicacion}
                  onChange={(e) => set('ubicacion', e.target.value)}
                />
                <Input
                  label="Valor residual (override)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorResidual}
                  onChange={(e) => set('valorResidual', e.target.value)}
                />
                <Input
                  label="Vida útil en meses (override)"
                  type="number"
                  min="1"
                  value={formData.vidaUtilMesesOverride}
                  onChange={(e) => set('vidaUtilMesesOverride', e.target.value)}
                />
              </div>
            </FormSection>

            <div className="flex justify-end gap-2 border-t border-slate-100 py-6">
              <Button
                variant="secondary"
                onClick={() => router.push('/inventario/bienes')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftIcon={<Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              >
                Guardar
              </Button>
            </div>
          </form>
        </Card>

      </div>

      <CategoriaFormModal
        open={showCategoriaModal}
        onClose={() => setShowCategoriaModal(false)}
        onSaved={(data: any) => recargarCategorias(data?.id)}
      />

      <CustodioFormModal
        open={showCustodioModal}
        onClose={() => setShowCustodioModal(false)}
        onSaved={(data: any) => recargarCustodios(data?.id)}
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PaginationNav } from '@/components/ui/PaginationNav';
import { contratosApi, personasApi } from '@/lib/api';

const stepTitles = [
  'Datos del contrato',
  'Datos del difunto',
  'Datos de los responsables',
  'Pago',
  'Verificacion de datos',
];

type ResponsableWizard = {
  localId: string;
  id?: number;
  esExistente: boolean;
  nombres: string;
  apellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  parentesco?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

type CuotaWizard = {
  numero: number;
  monto: number;
  fechaVencimiento: string;
  pagada: boolean;
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addYears(dateValue: string, years: number) {
  const date = new Date(dateValue);
  date.setFullYear(date.getFullYear() + years);
  return toInputDate(date);
}

function getYearDiff(fechaInicio: string, fechaFin: string) {
  if (!fechaInicio || !fechaFin) return 0;

  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end <= start) return 0;

  let years = end.getFullYear() - start.getFullYear();
  const endBeforeStartAnniversary =
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate());

  if (endBeforeStartAnniversary) {
    years -= 1;
  }

  return years > 0 ? years : 0;
}

export default function CreateContratoPage() {
  const router = useRouter();
  const today = toInputDate(new Date());

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [metadata, setMetadata] = useState<any>({ descuentos: [], bancos: [], tiposPago: ['Efectivo', 'Transferencia', 'Banco'] });
  const [personas, setPersonas] = useState<any[]>([]);
  const [responsableSearch, setResponsableSearch] = useState('');
  const [showResponsableModal, setShowResponsableModal] = useState(false);
  const [showBovedaModal, setShowBovedaModal] = useState(false);
  const [bovedaSearch, setBovedaSearch] = useState('');
  const [bovedaTipo, setBovedaTipo] = useState('');
  const [bovedasDisponibles, setBovedasDisponibles] = useState<any[]>([]);
  const [bovedasMeta, setBovedasMeta] = useState<any>(null);
  const [bovedasPage, setBovedasPage] = useState(1);

  const [newResponsable, setNewResponsable] = useState<ResponsableWizard>({
    localId: '',
    esExistente: false,
    nombres: '',
    apellidos: '',
    tipoIdentificacion: 'Cedula',
    numeroIdentificacion: '',
    telefono: '',
    email: '',
    direccion: '',
    parentesco: '',
    fechaInicio: today,
    fechaFin: '',
  });

  const [form, setForm] = useState({
    contrato: {
      numeroSecuencial: '',
      bovedaId: 0,
      bovedaLabel: '',
      fechaInicio: today,
      fechaFin: addYears(today, 5),
      numeroDeMeses: 5,
      montoTotal: 0,
      observaciones: '',
      esRenovacion: false,
      contratoOrigenId: null as number | null,
      contratoRelacionadoId: null as number | null,
    },
    difunto: {
      numeroIdentificacion: '',
      nombres: '',
      apellidos: '',
      fechaNacimiento: '',
      fechaFallecimiento: '',
      descuentoId: 0,
    },
    responsables: [] as ResponsableWizard[],
    pago: {
      tipoPago: 'Efectivo',
      numeroComprobante: '',
      monto: 0,
      fechaPago: today,
      bancoId: '',
      observacion: '',
      cuotasSeleccionadas: [] as number[],
    },
    cuotas: [] as CuotaWizard[],
  });

  const descuentoSeleccionado =
    metadata.descuentos?.find((item: any) => item.id === Number(form.difunto.descuentoId)) || null;
  const descuentoPorcentaje = descuentoSeleccionado ? Number(descuentoSeleccionado.porcentaje || 0) : 0;
  const montoDescuento = Number(form.contrato.montoTotal || 0) * (descuentoPorcentaje / 100);
  const montoFinalConDescuento = Number(form.contrato.montoTotal || 0) - montoDescuento;

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [createMetadata, personasResult, numeroPreview] = await Promise.all([
          contratosApi.obtenerMetadatosCreacion(),
          personasApi.findPage({ page: 1, limit: 100, search: '' }),
          contratosApi.obtenerNumeroSecuencial(),
        ]);

        setMetadata(createMetadata);
        setPersonas(personasResult.data || []);
        setForm((prev) => ({
          ...prev,
          contrato: {
            ...prev.contrato,
            numeroSecuencial: numeroPreview.numeroSecuencial || '',
            numeroDeMeses: Number(createMetadata.numeroDeMesesDefault || prev.contrato.numeroDeMeses || 5),
            fechaFin: addYears(
              prev.contrato.fechaInicio,
              Number(createMetadata.numeroDeMesesDefault || prev.contrato.numeroDeMeses || 5),
            ),
          },
        }));
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la configuracion del formulario');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!showBovedaModal) return;

    async function loadBovedasDisponibles() {
      try {
        const result = await contratosApi.obtenerBovedasDisponibles({
          page: bovedasPage,
          limit: 10,
          search: bovedaSearch,
          tipo: bovedaTipo || undefined,
        });
        setBovedasDisponibles(result.data || []);
        setBovedasMeta(result.meta);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la lista de bovedas');
      }
    }

    loadBovedasDisponibles();
  }, [showBovedaModal, bovedasPage, bovedaSearch, bovedaTipo]);

  useEffect(() => {
    const years = Number(form.contrato.numeroDeMeses) || 0;
    const cuotas = generateCuotas(
      form.contrato.fechaInicio,
      years,
      Number(form.contrato.montoTotal),
      Number(form.difunto.descuentoId),
    );

    setForm((prev) => {
      const cuotasSeleccionadasPrev = new Set(prev.pago.cuotasSeleccionadas);
      const cuotasSeleccionadas = cuotas
        .filter((cuota) => cuotasSeleccionadasPrev.size === 0 || cuotasSeleccionadasPrev.has(cuota.numero))
        .map((cuota) => cuota.numero);
      const monto = cuotas
        .filter((cuota) => cuotasSeleccionadas.includes(cuota.numero))
        .reduce((sum, cuota) => sum + cuota.monto, 0);

      return {
        ...prev,
        cuotas,
        pago: {
          ...prev.pago,
          cuotasSeleccionadas,
          monto,
        },
      };
    });
  }, [form.contrato.fechaInicio, form.contrato.numeroDeMeses, form.contrato.montoTotal, form.difunto.descuentoId]);

  function generateCuotas(fechaInicio: string, years: number, montoTotal: number, descuentoId: number) {
    if (!fechaInicio || years <= 0 || montoTotal <= 0) return [];

    const descuento = metadata.descuentos?.find((item: any) => item.id === descuentoId);
    const porcentaje = descuento ? Number(descuento.porcentaje) : 0;
    const montoFinal = montoTotal - montoTotal * (porcentaje / 100);
    const montoCuota = years > 0 ? montoFinal / years : 0;
    const fechaBase = new Date(fechaInicio);

    return Array.from({ length: years }, (_, index) => {
      const vencimiento = new Date(fechaBase);
      vencimiento.setFullYear(vencimiento.getFullYear() + index + 1);
      return {
        numero: index + 1,
        monto: Number(montoCuota.toFixed(2)),
        fechaVencimiento: toInputDate(vencimiento),
        pagada: false,
      };
    });
  }

  async function selectBoveda(boveda: any) {
    try {
      const preview = await contratosApi.obtenerNumeroSecuencial(boveda.id, false);
      setForm((prev) => ({
        ...prev,
        contrato: {
          ...prev.contrato,
          bovedaId: boveda.id,
          bovedaLabel: `${boveda.numero} - ${boveda.bloque?.nombre || 'Sin bloque'}`,
          numeroSecuencial: preview.numeroSecuencial,
          montoTotal: Number(preview.montoTotal || 0),
        },
      }));
      setShowBovedaModal(false);
    } catch (err: any) {
      setError(err.message || 'No se pudo seleccionar la boveda');
    }
  }

  function addExistingResponsable(persona: any) {
    if (form.responsables.some((item) => item.id === persona.id && item.esExistente)) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      responsables: [
        ...prev.responsables,
        {
          localId: `existing-${persona.id}`,
          id: persona.id,
          esExistente: true,
          nombres: persona.nombre,
          apellidos: persona.apellido,
          tipoIdentificacion: persona.tipoIdentificacion,
          numeroIdentificacion: persona.numeroIdentificacion,
          telefono: persona.telefono || '',
          email: persona.email || '',
          direccion: persona.direccion || '',
          parentesco: '',
          fechaInicio: today,
          fechaFin: '',
        },
      ],
    }));
  }

  function addNewResponsable() {
    if (!newResponsable.nombres || !newResponsable.apellidos || !newResponsable.numeroIdentificacion) {
      setError('Complete al menos nombres, apellidos y numero de identificacion del responsable');
      return;
    }

    setForm((prev) => ({
      ...prev,
      responsables: [
        ...prev.responsables,
        {
          ...newResponsable,
          localId: `new-${Date.now()}`,
        },
      ],
    }));

    setNewResponsable({
      localId: '',
      esExistente: false,
      nombres: '',
      apellidos: '',
      tipoIdentificacion: 'Cedula',
      numeroIdentificacion: '',
      telefono: '',
      email: '',
      direccion: '',
      parentesco: '',
      fechaInicio: today,
      fechaFin: '',
    });
    setShowResponsableModal(false);
  }

  function updateResponsable(localId: string, field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      responsables: prev.responsables.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeResponsable(localId: string) {
    setForm((prev) => ({
      ...prev,
      responsables: prev.responsables.filter((item) => item.localId !== localId),
    }));
  }

  function toggleCuota(numero: number, checked: boolean) {
    setForm((prev) => {
      const cuotasSeleccionadas = checked
        ? [...new Set([...prev.pago.cuotasSeleccionadas, numero])]
        : prev.pago.cuotasSeleccionadas.filter((item) => item !== numero);
      const monto = prev.cuotas
        .filter((cuota) => cuotasSeleccionadas.includes(cuota.numero))
        .reduce((sum, cuota) => sum + cuota.monto, 0);

      return {
        ...prev,
        pago: {
          ...prev.pago,
          cuotasSeleccionadas,
          monto: Number(monto.toFixed(2)),
        },
      };
    });
  }

  function toggleAllCuotas(checked: boolean) {
    setForm((prev) => {
      const cuotasSeleccionadas = checked ? prev.cuotas.map((cuota) => cuota.numero) : [];
      const monto = checked ? prev.cuotas.reduce((sum, cuota) => sum + cuota.monto, 0) : 0;
      return {
        ...prev,
        pago: {
          ...prev.pago,
          cuotasSeleccionadas,
          monto: Number(monto.toFixed(2)),
        },
      };
    });
  }

  function validateStep(currentStep: number) {
    if (currentStep === 0) {
      if (!form.contrato.bovedaId) return 'Debe seleccionar una boveda.';
      if (!form.contrato.fechaInicio || !form.contrato.fechaFin) return 'Debe definir las fechas del contrato.';
      if (new Date(form.contrato.fechaInicio) >= new Date(form.contrato.fechaFin)) return 'La fecha de inicio debe ser anterior a la fecha de fin.';
      return '';
    }

    if (currentStep === 1) {
      if (!form.difunto.nombres || !form.difunto.apellidos) return 'Debe completar los datos del difunto.';
      if (form.difunto.fechaNacimiento && form.difunto.fechaFallecimiento) {
        if (new Date(form.difunto.fechaNacimiento) >= new Date(form.difunto.fechaFallecimiento)) {
          return 'La fecha de fallecimiento debe ser posterior a la fecha de nacimiento.';
        }
      }
      return '';
    }

    if (currentStep === 2) {
      if (form.responsables.length === 0) return 'Debe agregar al menos un responsable.';
      return '';
    }

    if (currentStep === 3) {
      if (!form.pago.tipoPago) return 'Debe seleccionar un tipo de pago.';
      if (form.pago.cuotasSeleccionadas.length === 0) return 'Debe seleccionar al menos una cuota.';
      return '';
    }

    return '';
  }

  async function handleNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setStep((prev) => Math.min(prev + 1, stepTitles.length - 1));
  }

  async function handleSave() {
    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await contratosApi.create({
        contrato: {
          ...form.contrato,
          cuotas: form.cuotas.map((cuota) => ({
            ...cuota,
            pagada: form.pago.cuotasSeleccionadas.includes(cuota.numero),
          })),
        },
        difunto: form.difunto,
        responsables: form.responsables,
        pago: form.pago,
      });
      router.push(`/contratos/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el contrato');
    } finally {
      setSaving(false);
    }
  }

  const filteredPersonas = personas.filter((persona) => {
    const fullName = `${persona.nombre || ''} ${persona.apellido || ''}`.toLowerCase();
    const search = responsableSearch.toLowerCase();
    return (
      fullName.includes(search) ||
      String(persona.numeroIdentificacion || '').toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    if (descuentoPorcentaje >= 100) {
      setForm((prev) => ({
        ...prev,
        pago: {
          ...prev.pago,
          numeroComprobante: 'S/N',
        },
      }));
    }
  }, [descuentoPorcentaje]);

  return (
    <div>
      <div className="page-header">
        <div className="card bg-primary shadow-sm border-0">
          <div className="card-body d-flex flex-wrap justify-content-between align-items-center py-3 px-4">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <span className="me-3">
                <i className="ti ti-file-plus text-white fs-2"></i>
              </span>
              <div>
                <h2 className="h4 text-white mb-1">Contrato de Servicio de Arrendamiento de Cementerio</h2>
                <p className="mb-0 text-white-50 small">
                  {form.contrato.numeroSecuencial || 'Generando numero de contrato...'}
                </p>
              </div>
            </div>
            <Link href="/contratos" className="btn btn-outline-light">
              <i className="ti ti-list me-1"></i> Ver todos
            </Link>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            {stepTitles.map((title, index) => (
              <div key={title} className="d-flex align-items-center flex-fill" style={{ minWidth: 160 }}>
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                    index < step ? 'bg-success text-white' : index === step ? 'bg-primary text-white' : 'bg-light text-muted'
                  }`}
                  style={{ width: 38, height: 38, border: '2px solid #dee2e6', fontWeight: 700 }}
                >
                  {index + 1}
                </div>
                <div className="small fw-semibold">{title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {form.contrato.esRenovacion && form.contrato.contratoOrigenId ? (
        <div className="alert alert-primary border-0 shadow-sm mb-4">
          <h5 className="alert-heading mb-2 text-primary">
            <i className="ti ti-info-circle me-1"></i>
            Este es un contrato de renovacion
          </h5>
          <p className="mb-0">
            Este contrato renueva el contrato original con ID: <strong>{form.contrato.contratoOrigenId}</strong>
          </p>
        </div>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {loading ? <div className="alert alert-info">Cargando configuracion del contrato...</div> : null}

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">{stepTitles[step]}</h5>
        </div>
        <div className="card-body p-4">
          {step === 0 ? (
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="contrato-numero-secuencial">Numero Secuencial</label>
                <input id="contrato-numero-secuencial" className="form-control" value={form.contrato.numeroSecuencial} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="contrato-boveda">Boveda</label>
                <div className="input-group">
                  <input id="contrato-boveda" className="form-control" value={form.contrato.bovedaLabel || 'Seleccionar boveda'} readOnly />
                  <button type="button" className="btn btn-outline-primary" onClick={() => setShowBovedaModal(true)}>
                    <i className="ti ti-search me-1"></i> Buscar
                  </button>
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="contrato-fecha-inicio">Fecha de Inicio</label>
                <input
                  id="contrato-fecha-inicio"
                  type="date"
                  className="form-control"
                  value={form.contrato.fechaInicio}
                  onChange={(e) =>
                    setForm((prev) => {
                      const fechaInicio = e.target.value;
                      return {
                        ...prev,
                        contrato: {
                          ...prev.contrato,
                          fechaInicio,
                          numeroDeMeses: getYearDiff(fechaInicio, prev.contrato.fechaFin),
                        },
                      };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="contrato-fecha-fin">Fecha de Fin</label>
                <input
                  id="contrato-fecha-fin"
                  type="date"
                  className="form-control"
                  value={form.contrato.fechaFin}
                  onChange={(e) =>
                    setForm((prev) => {
                      const fechaFin = e.target.value;
                      return {
                        ...prev,
                        contrato: {
                          ...prev.contrato,
                          fechaFin,
                          numeroDeMeses: getYearDiff(prev.contrato.fechaInicio, fechaFin),
                        },
                      };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="contrato-numero-anos">Numero de Anos</label>
                <input id="contrato-numero-anos" type="number" className="form-control" value={form.contrato.numeroDeMeses} readOnly />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="contrato-monto-total">Monto Total</label>
                <input
                  id="contrato-monto-total"
                  type="number"
                  className="form-control"
                  step="0.01"
                  value={form.contrato.montoTotal}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contrato: { ...prev.contrato, montoTotal: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="contrato-observaciones">Observaciones</label>
                <textarea
                  id="contrato-observaciones"
                  className="form-control"
                  rows={3}
                  value={form.contrato.observaciones}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contrato: { ...prev.contrato, observaciones: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="difunto-cedula">Cedula</label>
                <input
                  id="difunto-cedula"
                  className="form-control"
                  value={form.difunto.numeroIdentificacion}
                  onChange={(e) => setForm((prev) => ({ ...prev, difunto: { ...prev.difunto, numeroIdentificacion: e.target.value } }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="difunto-nombres">Nombres</label>
                <input
                  id="difunto-nombres"
                  className="form-control"
                  value={form.difunto.nombres}
                  onChange={(e) => setForm((prev) => ({ ...prev, difunto: { ...prev.difunto, nombres: e.target.value } }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="difunto-apellidos">Apellidos</label>
                <input
                  id="difunto-apellidos"
                  className="form-control"
                  value={form.difunto.apellidos}
                  onChange={(e) => setForm((prev) => ({ ...prev, difunto: { ...prev.difunto, apellidos: e.target.value } }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" htmlFor="difunto-fecha-nacimiento">Fecha de Nacimiento</label>
                <input
                  id="difunto-fecha-nacimiento"
                  type="date"
                  className="form-control"
                  value={form.difunto.fechaNacimiento}
                  onChange={(e) => setForm((prev) => ({ ...prev, difunto: { ...prev.difunto, fechaNacimiento: e.target.value } }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" htmlFor="difunto-fecha-defuncion">Fecha de Defuncion</label>
                <input
                  id="difunto-fecha-defuncion"
                  type="date"
                  className="form-control"
                  value={form.difunto.fechaFallecimiento}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, difunto: { ...prev.difunto, fechaFallecimiento: e.target.value } }))
                  }
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="difunto-descuento">Descuento</label>
                <select
                  id="difunto-descuento"
                  className="form-select"
                  value={form.difunto.descuentoId}
                  onChange={(e) => setForm((prev) => ({ ...prev, difunto: { ...prev.difunto, descuentoId: Number(e.target.value) } }))}
                >
                  <option value={0}>Sin descuento</option>
                  {metadata.descuentos?.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} - {Number(item.porcentaje).toFixed(2)}%
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <div className="d-flex gap-2 mb-3">
                <input
                  className="form-control"
                  placeholder="Buscar responsable existente..."
                  value={responsableSearch}
                  onChange={(e) => setResponsableSearch(e.target.value)}
                />
                <button type="button" className="btn btn-success" onClick={() => setShowResponsableModal(true)}>
                  <i className="ti ti-plus"></i>
                </button>
              </div>

              <div className="row">
                <div className="col-lg-5">
                  <div className="border rounded p-3 h-100">
                    <h6 className="mb-3">Personas existentes</h6>
                    <div style={{ maxHeight: 320, overflow: 'auto' }}>
                      {filteredPersonas.map((persona) => (
                        <button
                          key={persona.id}
                          type="button"
                          className="btn btn-light border w-100 text-start mb-2"
                          onClick={() => addExistingResponsable(persona)}
                        >
                          <div className="fw-semibold">{persona.nombre} {persona.apellido}</div>
                          <div className="small text-muted">{persona.numeroIdentificacion}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="border rounded p-3 h-100">
                    <h6 className="mb-3">Responsables agregados</h6>
                    {form.responsables.length === 0 ? (
                      <div className="text-muted">No hay responsables agregados.</div>
                    ) : (
                      form.responsables.map((responsable) => (
                        <div key={responsable.localId} className="card mb-3">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-semibold">{responsable.nombres} {responsable.apellidos}</div>
                                <div className="small text-muted">{responsable.tipoIdentificacion}: {responsable.numeroIdentificacion}</div>
                              </div>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeResponsable(responsable.localId)}>
                                <i className="ti ti-trash"></i>
                              </button>
                            </div>
                            <div className="row g-2 mt-2">
                              <div className="col-md-4">
                                <label className="form-label small">Parentesco</label>
                                <input
                                  className="form-control"
                                  value={responsable.parentesco || ''}
                                  onChange={(e) => updateResponsable(responsable.localId, 'parentesco', e.target.value)}
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label small">Fecha Inicio</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={responsable.fechaInicio || ''}
                                  onChange={(e) => updateResponsable(responsable.localId, 'fechaInicio', e.target.value)}
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label small">Fecha Fin</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={responsable.fechaFin || ''}
                                  onChange={(e) => updateResponsable(responsable.localId, 'fechaFin', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              {Number(form.difunto.descuentoId) > 0 ? (
                <div className="alert alert-info">
                  <strong>Descuento aplicado:</strong> {descuentoPorcentaje.toFixed(2)}%
                  <br />
                  <strong>Monto antes de descuento:</strong> ${Number(form.contrato.montoTotal || 0).toFixed(2)}
                  <br />
                  <strong>Monto descontado:</strong> ${montoDescuento.toFixed(2)}
                  <br />
                  <strong>Total a pagar:</strong> ${montoFinalConDescuento.toFixed(2)}
                </div>
              ) : null}
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold" htmlFor="pago-tipo">Tipo de Pago</label>
                  <select
                    id="pago-tipo"
                    className="form-select"
                    value={form.pago.tipoPago}
                    onChange={(e) => setForm((prev) => ({ ...prev, pago: { ...prev.pago, tipoPago: e.target.value } }))}
                  >
                    {metadata.tiposPago?.map((tipo: string) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold" htmlFor="pago-comprobante">Numero de Comprobante</label>
                  <input
                    id="pago-comprobante"
                    className="form-control"
                    value={form.pago.numeroComprobante}
                    readOnly={descuentoPorcentaje >= 100}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, pago: { ...prev.pago, numeroComprobante: e.target.value } }))
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold" htmlFor="pago-fecha">Fecha de Pago</label>
                  <input
                    id="pago-fecha"
                    type="date"
                    className="form-control"
                    value={form.pago.fechaPago}
                    onChange={(e) => setForm((prev) => ({ ...prev, pago: { ...prev.pago, fechaPago: e.target.value } }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold" htmlFor="pago-monto">Monto</label>
                  <input id="pago-monto" className="form-control" value={form.pago.monto.toFixed(2)} readOnly />
                </div>
              </div>

              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Cuotas por pagar</h6>
                  <div className="fw-semibold">Total: ${form.pago.monto.toFixed(2)}</div>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>
                          <input
                            type="checkbox"
                            checked={form.cuotas.length > 0 && form.pago.cuotasSeleccionadas.length === form.cuotas.length}
                            onChange={(e) => toggleAllCuotas(e.target.checked)}
                          />
                        </th>
                        <th>Cuota</th>
                        <th>Fecha Vencimiento</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.cuotas.map((cuota) => (
                        <tr key={cuota.numero}>
                          <td>
                            <input
                              type="checkbox"
                              checked={form.pago.cuotasSeleccionadas.includes(cuota.numero)}
                              onChange={(e) => toggleCuota(cuota.numero, e.target.checked)}
                            />
                          </td>
                          <td>Cuota {cuota.numero}</td>
                          <td>{cuota.fechaVencimiento}</td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary fs-6">
                              ${cuota.monto.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-header"><strong>Contrato</strong></div>
                  <div className="card-body">
                    <p><strong>Numero:</strong> {form.contrato.numeroSecuencial}</p>
                    <p><strong>Boveda:</strong> {form.contrato.bovedaLabel}</p>
                    <p><strong>Vigencia:</strong> {form.contrato.fechaInicio} al {form.contrato.fechaFin}</p>
                    <p><strong>Monto:</strong> ${Number(form.contrato.montoTotal).toFixed(2)}</p>
                    <p className="mb-0"><strong>Observaciones:</strong> {form.contrato.observaciones || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-header"><strong>Difunto</strong></div>
                  <div className="card-body">
                    <p><strong>Nombre:</strong> {form.difunto.nombres} {form.difunto.apellidos}</p>
                    <p><strong>Identificacion:</strong> {form.difunto.numeroIdentificacion || '-'}</p>
                    <p><strong>Nacimiento:</strong> {form.difunto.fechaNacimiento || '-'}</p>
                    <p className="mb-0"><strong>Defuncion:</strong> {form.difunto.fechaFallecimiento || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-7">
                <div className="card h-100">
                  <div className="card-header"><strong>Responsables</strong></div>
                  <div className="card-body">
                    {form.responsables.map((responsable) => (
                      <div key={responsable.localId} className="border rounded p-2 mb-2">
                        <div className="fw-semibold">{responsable.nombres} {responsable.apellidos}</div>
                        <div className="small text-muted">{responsable.numeroIdentificacion} {responsable.parentesco ? `- ${responsable.parentesco}` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card h-100">
                  <div className="card-header"><strong>Pago</strong></div>
                  <div className="card-body">
                    <p><strong>Tipo:</strong> {form.pago.tipoPago}</p>
                    <p><strong>Comprobante:</strong> {form.pago.numeroComprobante || '-'}</p>
                    <p><strong>Fecha:</strong> {form.pago.fechaPago}</p>
                    <p className="mb-0"><strong>Total:</strong> ${form.pago.monto.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="card-footer d-flex justify-content-between">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={step === 0 || saving}>
            <i className="ti ti-arrow-left me-1"></i> Atras
          </button>

          {step < stepTitles.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext} disabled={loading || saving}>
              Siguiente <i className="ti ti-arrow-right ms-1"></i>
            </button>
          ) : (
            <Button onClick={handleSave} disabled={saving} variant="primary" icon="ti-check">
              {saving ? 'Guardando...' : 'Finalizar y Guardar'}
            </Button>
          )}
        </div>
      </div>

      {showBovedaModal ? (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Seleccionar Boveda</h5>
                <button type="button" className="btn-close" onClick={() => setShowBovedaModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <input
                      className="form-control"
                      placeholder="Buscar por numero"
                      value={bovedaSearch}
                      onChange={(e) => {
                        setBovedasPage(1);
                        setBovedaSearch(e.target.value);
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={bovedaTipo}
                      onChange={(e) => {
                        setBovedasPage(1);
                        setBovedaTipo(e.target.value);
                      }}
                    >
                      <option value="">Todos los tipos</option>
                      <option value="Boveda">Boveda</option>
                      <option value="Nicho">Nicho</option>
                      <option value="Tumulo">Tumulo</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Numero</th>
                        <th>Bloque</th>
                        <th>Tipo</th>
                        <th>Propietario</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bovedasDisponibles.length > 0 ? (
                        bovedasDisponibles.map((boveda) => (
                          <tr key={boveda.id}>
                            <td>{boveda.numero}</td>
                            <td>{boveda.bloque?.nombre || '-'}</td>
                            <td>{boveda.tipo || '-'}</td>
                            <td>{boveda.propietario?.persona ? `${boveda.propietario.persona.nombre} ${boveda.propietario.persona.apellido}` : 'Sin propietario'}</td>
                            <td className="text-end">
                              <button type="button" className="btn btn-sm btn-success" onClick={() => selectBoveda(boveda)}>
                                Seleccionar
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No se encontraron bovedas disponibles para los filtros aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <PaginationNav meta={bovedasMeta} onPageChange={setBovedasPage} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showResponsableModal ? (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Crear Nuevo Responsable</h5>
                <button type="button" className="btn-close" onClick={() => setShowResponsableModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="responsable-nombres">Nombres</label>
                    <input id="responsable-nombres" className="form-control" value={newResponsable.nombres} onChange={(e) => setNewResponsable((prev) => ({ ...prev, nombres: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="responsable-apellidos">Apellidos</label>
                    <input id="responsable-apellidos" className="form-control" value={newResponsable.apellidos} onChange={(e) => setNewResponsable((prev) => ({ ...prev, apellidos: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="responsable-tipo-identificacion">Tipo Identificacion</label>
                    <select id="responsable-tipo-identificacion" className="form-select" value={newResponsable.tipoIdentificacion} onChange={(e) => setNewResponsable((prev) => ({ ...prev, tipoIdentificacion: e.target.value }))}>
                      <option value="Cedula">Cedula</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="responsable-numero-identificacion">Numero Identificacion</label>
                    <input id="responsable-numero-identificacion" className="form-control" value={newResponsable.numeroIdentificacion} onChange={(e) => setNewResponsable((prev) => ({ ...prev, numeroIdentificacion: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="responsable-telefono">Telefono</label>
                    <input id="responsable-telefono" className="form-control" value={newResponsable.telefono} onChange={(e) => setNewResponsable((prev) => ({ ...prev, telefono: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="responsable-email">Email</label>
                    <input id="responsable-email" className="form-control" value={newResponsable.email} onChange={(e) => setNewResponsable((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="responsable-direccion">Direccion</label>
                    <input id="responsable-direccion" className="form-control" value={newResponsable.direccion} onChange={(e) => setNewResponsable((prev) => ({ ...prev, direccion: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResponsableModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={addNewResponsable}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

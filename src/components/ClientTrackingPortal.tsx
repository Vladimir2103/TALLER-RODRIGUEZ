import React, { useEffect, useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrder, Appointment, WorkOrderStage } from '../types';
import { WORKSHOP_CONFIG } from '../data/initialData';
import { formatCurrency } from '../utils/format';
import {
  Car,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Phone,
  MessageCircle,
  Share2,
  Copy,
  Check,
  Shield,
  MapPin,
  RefreshCw,
  Fuel,
  Gauge,
  User,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import confetti from 'canvas-confetti';

interface ClientTrackingPortalProps {
  type: 'ot' | 'cita';
  id: string;
}

export const ClientTrackingPortal: React.FC<ClientTrackingPortalProps> = ({
  type,
  id,
}) => {
  const { workOrders, appointments, syncStatus, workshopContact } = useWorkshop();
  const activeContact = workshopContact || WORKSHOP_CONFIG;
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [serverFetchedItem, setServerFetchedItem] = useState<WorkOrder | Appointment | null>(null);

  const cleanId = (id || '').trim();

  // Find from local context or server fetched
  const liveOT: WorkOrder | undefined =
    type === 'ot'
      ? workOrders.find(o => o.id === cleanId || o.otNumber.toLowerCase() === cleanId.toLowerCase()) ||
        (serverFetchedItem && 'otNumber' in serverFetchedItem ? (serverFetchedItem as WorkOrder) : undefined)
      : undefined;

  const liveApp: Appointment | undefined =
    type === 'cita'
      ? appointments.find(a => a.id === cleanId) ||
        (serverFetchedItem && 'scheduledTime' in serverFetchedItem ? (serverFetchedItem as Appointment) : undefined)
      : undefined;

  // Poll server tracking endpoint as guaranteed real-time fallback
  useEffect(() => {
    let isMounted = true;

    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/tracking/${type}/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setServerFetchedItem(json.data);
            setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        }
      } catch {
        // Fallback to local workshop context
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 4000); // 4-second resilient polling

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [type, cleanId]);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const res = await fetch(`/api/tracking/${type}/${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setServerFetchedItem(json.data);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTimeout(() => setIsManualRefreshing(false), 500);
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.4 } });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper for Work Order stages
  const getStageConfig = (stage: WorkOrderStage) => {
    switch (stage) {
      case 'recepcion':
        return {
          title: 'Vehículo Ingresado',
          subtitle: 'Tu vehículo ha ingresado a las instalaciones del taller para su inspección preliminar.',
          percent: 15,
          color: 'bg-blue-500',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/40',
          bgSoft: 'bg-blue-950/40',
        };
      case 'diagnostico':
        return {
          title: 'Diagnóstico en Ejecución',
          subtitle: 'El equipo técnico realiza pruebas computarizadas y revisión física del sistema reportado.',
          percent: 35,
          color: 'bg-amber-500',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/40',
          bgSoft: 'bg-amber-950/40',
        };
      case 'espera_repuestos':
        return {
          title: 'En Espera de Repuestos',
          subtitle: 'Se han solicitado piezas originales o repuestos de alta calidad requeridos para la reparación.',
          percent: 45,
          color: 'bg-orange-500',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/40',
          bgSoft: 'bg-orange-950/40',
        };
      case 'en_reparacion':
        return {
          title: 'Reparación en Proceso',
          subtitle: 'Los mecánicos asignados se encuentran ejecutando los trabajos técnicos en tu vehículo.',
          percent: 70,
          color: 'bg-purple-500',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/40',
          bgSoft: 'bg-purple-950/40',
        };
      case 'control_calidad':
        return {
          title: 'Control de Calidad y Pruebas',
          subtitle: 'Pruebas de ruta, verificación de frenado, escaneo post-reparación y certificación del trabajo.',
          percent: 88,
          color: 'bg-cyan-500',
          textColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/40',
          bgSoft: 'bg-cyan-950/40',
        };
      case 'listo_entrega':
        return {
          title: '¡Vehículo LISTO para Entrega!',
          subtitle: 'Todos los trabajos concluyeron con éxito. Puedes pasar a retirar tu vehículo en el taller.',
          percent: 100,
          color: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/50',
          bgSoft: 'bg-emerald-950/50',
        };
      case 'entregado':
        return {
          title: 'Vehículo Entregado',
          subtitle: 'El vehículo fue entregado formalmente al propietario. ¡Gracias por tu preferencia!',
          percent: 100,
          color: 'bg-neutral-500',
          textColor: 'text-neutral-300',
          borderColor: 'border-neutral-700',
          bgSoft: 'bg-neutral-900',
        };
      default:
        return {
          title: 'En Servicio',
          subtitle: 'Tu vehículo está siendo atendido en Taller Rodríguez Rodríguez.',
          percent: 50,
          color: 'bg-red-500',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/40',
          bgSoft: 'bg-red-950/40',
        };
    }
  };

  const stagesTimeline: { id: WorkOrderStage; label: string; desc: string }[] = [
    { id: 'recepcion', label: '1. Recepción', desc: 'Ingreso al taller e inspección visual inicial' },
    { id: 'diagnostico', label: '2. Diagnóstico', desc: 'Escaneo computarizado y evaluación técnica' },
    { id: 'en_reparacion', label: '3. Reparación', desc: 'Mano de obra especializada y refacciones' },
    { id: 'control_calidad', label: '4. Calidad', desc: 'Pruebas de funcionamiento y chequeo de seguridad' },
    { id: 'listo_entrega', label: '5. Listo', desc: 'Finalizado y listo para ser retirado' },
  ];

  const getStageStepStatus = (stepId: WorkOrderStage, currentStage: WorkOrderStage) => {
    const orderIndexMap: Record<WorkOrderStage, number> = {
      recepcion: 1,
      diagnostico: 2,
      espera_repuestos: 2.5,
      en_reparacion: 3,
      control_calidad: 4,
      listo_entrega: 5,
      entregado: 6,
    };
    const currentIdx = orderIndexMap[currentStage] || 1;
    const stepIdx = orderIndexMap[stepId] || 1;

    if (currentIdx > stepIdx || currentStage === 'entregado') return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  };

  // If item not found
  if (type === 'ot' && !liveOT) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Orden de Trabajo No Encontrada</h2>
          <p className="text-sm text-neutral-400 mb-6">
            El código o identificador de orden <span className="font-mono text-red-400">{cleanId}</span> no existe o fue completada recientemente. Verifica el enlace enviado por el taller.
          </p>
          <div className="space-y-3">
            <a
              href={`https://wa.me/${WORKSHOP_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                `Hola Taller Rodríguez Rodríguez, tengo una consulta sobre mi orden ${cleanId}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Contactar al Taller por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'cita' && !liveApp) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Cita No Encontrada</h2>
          <p className="text-sm text-neutral-400 mb-6">
            No se encontró la cita indicada. Por favor confirma tu fecha con el personal del taller.
          </p>
          <a
            href={`https://wa.me/${WORKSHOP_CONFIG.whatsappNumber}?text=${encodeURIComponent(
              `Hola Taller Rodríguez Rodríguez, deseo consultar sobre mi cita.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Consultar al Taller por WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  const stageConfig = liveOT ? getStageConfig(liveOT.stage) : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-red-600/30 selection:text-white">
      {/* Top Banner with Workshop Brand & Live Beacon */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 aspect-square rounded-xl bg-black border border-neutral-800 p-0.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img
                src="/logo.png"
                alt="Taller Automotriz Rodríguez Rodríguez"
                className="w-full h-full aspect-square object-contain select-none"
                style={{ objectFit: 'contain', aspectRatio: '1 / 1' }}
                loading="eager"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white uppercase font-sans leading-tight truncate">
                Taller Automotriz Rodríguez Rodríguez
              </span>
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-red-500" />
                <span>El Salvador, Usulután</span>
              </span>
            </div>
          </div>

          {/* Right Live Beacon & Share / Staff Switch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* PWA Install Button for Android / Phone */}
            <PWAInstallButton variant="header" />

            {/* Live Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>EN VIVO</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white cursor-pointer transition-colors"
              title="Copiar enlace de seguimiento"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Banner para Descargar/Instalar como App en Android o teléfono */}
        <PWAInstallButton variant="banner" />

        {/* Read-Only Client Banner */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Portal de Seguimiento del Cliente · <strong className="text-emerald-400">Modo Solo Lectura</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
            <span className="hidden md:inline">Actualizado: {lastRefreshed}</span>
            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin text-red-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* WORK ORDER VIEW */}
        {type === 'ot' && liveOT && stageConfig && (
          <>
            {/* Hero Stage Banner */}
            <div className={`p-5 sm:p-7 rounded-2xl ${stageConfig.bgSoft} border ${stageConfig.borderColor} shadow-xl relative overflow-hidden transition-all`}>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${stageConfig.textColor}`}>
                      Estado Actual del Vehículo
                    </span>
                  </div>
                  <span className="font-mono text-xs text-neutral-400">
                    Orden N°: <strong className="text-white font-bold">{liveOT.otNumber}</strong>
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {stageConfig.title}
                  </h1>
                  <p className="text-sm text-neutral-300 mt-1 max-w-xl">
                    {stageConfig.subtitle}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Progreso Estimado de Reparación</span>
                    <span className="font-bold text-white">{stageConfig.percent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full ${stageConfig.color} transition-all duration-700 ease-out`}
                      style={{ width: `${stageConfig.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stepped Timeline */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Etapas de Servicio en Taller</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                {stagesTimeline.map(step => {
                  const stepStatus = getStageStepStatus(step.id, liveOT.stage);
                  const isCompleted = stepStatus === 'completed';
                  const isActive = stepStatus === 'active';

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        isActive
                          ? 'bg-neutral-950 border-red-500/60 shadow-md shadow-red-950/30'
                          : isCompleted
                          ? 'bg-neutral-950/60 border-emerald-500/30 text-neutral-300'
                          : 'bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-bold font-mono text-[11px] ${isActive ? 'text-red-400' : isCompleted ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          {step.label}
                        </span>
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle & Assignment Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vehicle Specs */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  <Car className="w-4 h-4 text-red-500" />
                  <span>Vehículo Registrado</span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase">
                    {liveOT.vehicleBrand} {liveOT.vehicleModel}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Año: {liveOT.vehicleYear || 'N/D'}</p>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Placas:</span>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 font-bold text-amber-300">
                    {liveOT.vehiclePlate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Kilometraje Ingreso:</span>
                  <span className="text-neutral-200">{liveOT.mileageIn.toLocaleString()} km</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Combustible:</span>
                  </span>
                  <span className="text-neutral-200">{liveOT.fuelLevel}</span>
                </div>
              </div>

              {/* Technical Assignment & Deadlines */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Equipo Técnico Asignado</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">
                    {liveOT.assignedTechnician || 'Mecánico de Turno'}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Especialista en Mecánica & Diagnóstico</p>
                </div>

                <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Ingreso:</span>
                    <span className="text-neutral-200">{liveOT.startDate || 'Hoy'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Estimación Entrega:</span>
                    <span className="text-emerald-400 font-bold">{liveOT.estimatedCompletionDate || 'En proceso'}</span>
                  </div>
                </div>
              </div>

              {/* Priority & Financial Status */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span>Resumen de Cuenta</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block">Total del Servicio</span>
                  <span className="text-2xl font-black text-white font-mono">
                    {formatCurrency(liveOT.total)}
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Estado de Pago:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        liveOT.paymentStatus === 'pagado'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : liveOT.paymentStatus === 'anticipo'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {liveOT.paymentStatus}
                    </span>
                  </div>

                  {liveOT.amountPaid > 0 && liveOT.paymentStatus !== 'pagado' && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Saldo Pendiente:</span>
                      <span className="text-amber-400 font-bold">
                        {formatCurrency(Math.max(0, liveOT.total - liveOT.amountPaid))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnostic & Technical Notes */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>Diagnóstico y Trabajos Solicitados</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold block mb-1">
                    Motivo de Ingreso Reportado
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-200">
                    {liveOT.reportedFault || 'Revisión y mantenimiento general'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
                  <span className="text-[10px] text-amber-400 font-mono uppercase font-bold block mb-1">
                    Diagnóstico Técnico Oficial
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-200">
                    {liveOT.diagnosedProblem || 'Inspección técnica en proceso por el mecánico a cargo.'}
                  </p>
                </div>
              </div>

              {liveOT.technicianNotes && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold block mb-1">
                    Observaciones Técnicas Adicionales
                  </span>
                  <p className="text-xs text-neutral-300">
                    {liveOT.technicianNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Installed Parts & Labor Transparency */}
            {liveOT.partsUsed && liveOT.partsUsed.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-500" />
                  <span>Repuestos y Componentes Instalados</span>
                </h3>

                <div className="divide-y divide-neutral-800">
                  {liveOT.partsUsed.map((p, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          Código: {p.sku} · Cantidad: {p.quantity}
                        </div>
                      </div>
                      <div className="font-mono text-neutral-200 font-semibold">
                        {formatCurrency(p.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* APPOINTMENT VIEW */}
        {type === 'cita' && liveApp && (
          <div className="space-y-4">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-blue-950/40 via-neutral-900 to-neutral-900 border border-blue-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold tracking-wider uppercase">
                  <span>CITA CONFIRMADA EN TALLER</span>
                </div>
                <span className="font-mono text-xs text-neutral-400">ID: {liveApp.id}</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {liveApp.serviceRequested || 'Servicio Mecánico Programado'}
                </h1>
                <p className="text-sm text-neutral-300 mt-1">
                  Cliente: <strong className="text-white">{liveApp.clientName}</strong> · Vehículo:{' '}
                  <strong className="text-white">{liveApp.vehicleModel}</strong> ({liveApp.vehiclePlate})
                </p>
              </div>

              {/* Big Scheduled Date Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase block">Fecha y Hora Programada</span>
                    <span className="text-lg font-black text-white">
                      {liveApp.scheduledDate} a las {liveApp.scheduledTime} hrs
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block">Estado</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase text-xs">
                    {liveApp.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Preparation tips */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs text-neutral-300">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recomendaciones para el Día de tu Cita</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-neutral-400 mt-2">
                <li>Presentar las llaves del vehículo y tarjeta de circulación.</li>
                <li>Llegar 5 a 10 minutos antes de la hora acordada para recepción expedita.</li>
                <li>Nuestro equipo realizará la inspección de ingreso junto contigo.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Quick Contact & WhatsApp Action Bar */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                ¿Tienes dudas o deseas consultar sobre tu vehículo?
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Comunícate directamente con el Jefe de Taller (<strong className="text-neutral-200">{activeContact.bossName}</strong>): Tel: <strong className="text-white font-mono">{activeContact.phone}</strong> · Correo: <strong className="text-neutral-300 font-mono">{activeContact.email}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${activeContact.whatsappNumber}?text=${encodeURIComponent(
                  `Hola Taller Rodríguez Rodríguez, consulto sobre mi ${
                    type === 'ot' && liveOT ? `orden de trabajo ${liveOT.otNumber}` : 'cita en el taller'
                  }.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md shadow-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp Oficial</span>
              </a>

              <a
                href={`tel:${activeContact.phone}`}
                className="py-2.5 px-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Llamar</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800 bg-neutral-950 py-4 px-4 sm:px-6 text-center text-xs text-neutral-400 font-mono space-y-1">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-neutral-400">
          <span>{activeContact.legalName || 'Taller Automotriz Rodríguez Rodríguez'}</span>
          <span className="hidden sm:inline">·</span>
          <span>📍 {activeContact.address || 'El Salvador, Usulután'}</span>
          <span className="hidden sm:inline">·</span>
          <span>Atención Oficial: <strong className="text-white font-bold">{activeContact.bossName}</strong></span>
        </div>
        <p className="text-[11px] text-neutral-400">
          Monitoreo vehicular en tiempo real · Acceso de solo lectura
        </p>
      </footer>
    </div>
  );
};

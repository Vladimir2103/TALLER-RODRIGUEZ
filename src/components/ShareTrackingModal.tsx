import React, { useState } from 'react';
import { WorkOrder, Appointment } from '../types';
import { WORKSHOP_CONFIG } from '../data/initialData';
import {
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  X,
  Car,
  Calendar,
  Clock,
  QrCode,
  ShieldCheck,
  Eye,
  Wrench,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ot' | 'cita';
  item: WorkOrder | Appointment | null;
  onOpenClientView?: (type: 'ot' | 'cita', id: string) => void;
}

export const ShareTrackingModal: React.FC<ShareTrackingModalProps> = ({
  isOpen,
  onClose,
  type,
  item,
  onOpenClientView,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen || !item) return null;

  // Generate tracking URL
  const baseUrl = window.location.origin + window.location.pathname;
  const trackingUrl = `${baseUrl}?track=${type}&id=${item.id}`;

  const isOT = type === 'ot';
  const ot = isOT ? (item as WorkOrder) : null;
  const app = !isOT ? (item as Appointment) : null;

  const clientName = isOT ? ot?.clientName : app?.clientName;
  const clientPhone = isOT ? ot?.clientPhone : app?.clientPhone;
  const vehicleDesc = isOT
    ? `${ot?.vehicleBrand || ''} ${ot?.vehicleModel || 'Vehículo'}`.trim()
    : app?.vehicleModel || 'Vehículo';
  const vehiclePlate = isOT ? ot?.vehiclePlate : app?.vehiclePlate;
  const otNumber = ot?.otNumber;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Error copying to clipboard', e);
    }
  };

  const handleWhatsAppShare = () => {
    let cleanPhone = (clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone.startsWith('503') && cleanPhone.length === 8) {
      cleanPhone = `503${cleanPhone}`;
    }

    let message = '';
    if (isOT && ot) {
      message = `🚗 *${WORKSHOP_CONFIG.name}* 🚗\n\nEstimado/a *${clientName || 'Cliente'}*,\nTu vehículo *${vehicleDesc}* (Placas: *${vehiclePlate}*) ya está registrado con la orden de trabajo *${otNumber || ot.id}*.\n\n🔍 *Sigue el avance de tu auto en tiempo real desde tu celular:*\n${trackingUrl}\n\nℹ️ _(Enlace seguro de solo lectura · Actualizaciones en vivo)_\n📍 ${WORKSHOP_CONFIG.address}\n📞 Tel: ${WORKSHOP_CONFIG.phone}`;
    } else if (app) {
      message = `📅 *${WORKSHOP_CONFIG.name}* 📅\n\nEstimado/a *${clientName || 'Cliente'}*,\nTu cita en nuestro taller para tu vehículo *${vehicleDesc}* (Placas: *${vehiclePlate}*) ha sido programada para el *${app.scheduledDate}* a las *${app.scheduledTime} hrs*.\n\n🔍 *Consulta los detalles de tu cita y estado en vivo:*\n${trackingUrl}\n\n📍 ${WORKSHOP_CONFIG.address}\n📞 Tel: ${WORKSHOP_CONFIG.phone}`;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleTestView = () => {
    if (onOpenClientView) {
      onOpenClientView(type, item.id);
      onClose();
    } else {
      window.open(trackingUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 border-b border-neutral-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-800 cursor-pointer transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold tracking-wider uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ENLACE EN TIEMPO REAL GENERADO</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
            {isOT ? 'Seguimiento en Vivo para el Cliente' : 'Enlace de Cita para el Cliente'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            El cliente podrá monitorear el progreso de su vehículo en vivo. Es un portal <strong className="text-emerald-400">100% de solo lectura</strong> sin acceso a modificar nada ni requerir usuario.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Vehicle and Client Summary Card */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white text-sm truncate">{vehicleDesc}</div>
                <div className="text-neutral-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-[11px] text-amber-300">
                    {vehiclePlate || 'S/P'}
                  </span>
                  <span className="truncate">Cliente: <strong className="text-neutral-200">{clientName}</strong></span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 font-mono text-[11px]">
              {isOT ? (
                <div>
                  <span className="text-neutral-500 block text-[9px] uppercase">Orden</span>
                  <span className="text-red-400 font-bold">{otNumber}</span>
                </div>
              ) : (
                <div>
                  <span className="text-neutral-500 block text-[9px] uppercase">Cita</span>
                  <span className="text-blue-400 font-bold">{app?.scheduledTime} hrs</span>
                </div>
              )}
            </div>
          </div>

          {/* Generated URL Box */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-red-500" />
                <span>Enlace Directo para el Cliente</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Solo lectura · En vivo</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 truncate select-all">
                {trackingUrl}
              </div>

              <button
                onClick={handleCopy}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer select-none ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                }`}
                title="Copiar al portapapeles"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code toggler */}
          <div>
            <button
              type="button"
              onClick={() => setShowQr(prev => !prev)}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-red-400" />
              <span>{showQr ? 'Ocultar Código QR' : 'Mostrar Código QR para escanear en taller'}</span>
            </button>

            {showQr && (
              <div className="mt-2.5 p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center text-center animate-in fade-in duration-150">
                <div className="p-3 bg-white rounded-xl shadow-lg inline-block">
                  {/* High quality visual QR code using standard public qr server */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      trackingUrl
                    )}&color=000000&bgcolor=ffffff&qzone=1`}
                    alt="QR Code Seguimiento"
                    className="w-40 h-40 object-contain aspect-square"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-2">
                  El cliente puede escanear este código con su celular para ver el avance en tiempo real.
                </p>
              </div>
            )}
          </div>

          {/* Security & Read-Only Badge */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-200">Seguridad Total de Solo Lectura:</span>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                El cliente solo puede observar las etapas, diagnóstico y detalles públicos de su auto. Los botones de edición, presupuestos internos y administración están completamente bloqueados.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handleTestView}
              className="w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-850 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-neutral-700 cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4 text-red-400" />
              <span>Ver como Cliente</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span className="text-[11px] flex items-center gap-1">
            <Wrench className="w-3 h-3 text-red-500" />
            <span>Taller Rodríguez Rodríguez</span>
          </span>
          <button
            onClick={onClose}
            className="text-xs text-neutral-300 hover:text-white font-semibold cursor-pointer underline underline-offset-4"
          >
            Cerrar y volver al sistema
          </button>
        </div>
      </div>
    </div>
  );
};

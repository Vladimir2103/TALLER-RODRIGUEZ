import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { NotificationLog } from '../types';
import { MessageSquare, Send, Copy, Check, ExternalLink, X, Smartphone, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { WORKSHOP_CONFIG } from '../data/initialData';
import confetti from 'canvas-confetti';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultClientName?: string;
  defaultTemplate?: NotificationLog['templateType'];
  templateData?: Record<string, any>;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  defaultPhone = '',
  defaultClientName = '',
  defaultTemplate = 'ot_listo',
  templateData = {},
}) => {
  const { sendWhatsAppNotification, clients } = useWorkshop();

  const [phone, setPhone] = useState(defaultPhone);
  const [clientName, setClientName] = useState(defaultClientName);
  const [templateType, setTemplateType] = useState<NotificationLog['templateType']>(defaultTemplate);
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // If defaults changed
  React.useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
    if (defaultClientName) setClientName(defaultClientName);
    if (defaultTemplate) setTemplateType(defaultTemplate);
  }, [defaultPhone, defaultClientName, defaultTemplate]);

  if (!isOpen) return null;

  // Generate preview text based on template
  const getPreviewText = () => {
    const workshop = 'TALLER RODRIGUEZ RODRIGUEZ';
    const cName = clientName || 'Cliente';
    const veh = templateData.vehicle || 'Vehículo';
    const plate = templateData.plate || '';

    switch (templateType) {
      case 'cita':
        return `🚗 *${workshop}* 🚗\n\nEstimado/a *${cName}*,\nTu cita en nuestro taller ha sido confirmada para el día 📅 *${templateData.date || 'próximamente'}* a las ⏰ *${templateData.time || '08:30'} hrs*.\n\nVehículo: *${veh}* (${plate})\nServicio: ${templateData.service || 'Mantenimiento General'}\n\n📍 Ubicación: ${WORKSHOP_CONFIG.address}\n\n¡Te esperamos puntual! Si requieres reprogramar, respóndenos por este medio.`;

      case 'presupuesto':
        return `📋 *${workshop}* - Presupuesto Listo\n\nHola *${cName}*,\nHemos terminado el diagnóstico e inspección de tu vehículo *${veh}* (${plate}).\n\n📄 Presupuesto N°: *${templateData.quoteNumber || 'COT-2026-0042'}*\n💰 Total Estimado: *${formatCurrency(Number(templateData.total || 0))}*\n\nPuedes autorizarlo respondiendo "AUTORIZO" a este mensaje o consultarnos cualquier duda técnica.`;

      case 'ot_inicio':
        return `🔧 *${workshop}* - Orden de Trabajo Iniciada\n\nHola *${cName}*,\nTu vehículo *${veh}* (${plate}) ha ingresado al área de servicio con la orden *${templateData.otNumber || 'OT-2026-0145'}*.\n\nTécnico a cargo: *${templateData.technician || 'Carlos Rodríguez'}*\nFecha estimada de entrega: *${templateData.estimatedDate || 'Mañana 17:00 hrs'}*\n\nTe mantendremos informado del avance de las reparaciones.`;

      case 'ot_listo':
        return `✅ *${workshop}* - ¡Tu auto está LISTO!\n\nEstimado/a *${cName}*,\nNos complace informarte que las reparaciones de tu *${veh}* (${plate}) han concluido exitosamente tras superar las pruebas de control de calidad.\n\n📋 Orden: *${templateData.otNumber || 'OT-2026-0142'}*\n💵 Saldo a Liquidar: *${formatCurrency(Number(templateData.balanceDue !== undefined ? templateData.balanceDue : templateData.total || 0))}*\n\nPuedes retirarlo hoy en horario de 08:30 a 19:00 hrs. ¡Gracias por confiar en Taller Rodríguez Rodríguez!`;

      case 'mantenimiento':
        return `⚠️ *${workshop}* - Recordatorio de Mantenimiento\n\nHola *${cName}*,\nDe acuerdo a nuestros registros, tu *${veh}* (${plate}) está próximo a cumplir el kilometraje para su cambio de aceite y revisión de seguridad.\n\n¿Deseas que te agendemos una cita prioritaria esta semana?`;

      case 'personalizado':
        return customText || `Hola ${cName}, nos comunicamos de Taller Rodríguez Rodríguez respecto a tu vehículo ${veh}.`;
      default:
        return '';
    }
  };

  const preview = getPreviewText();

  const handleSend = () => {
    if (!phone) {
      alert('Por favor introduce un número de teléfono celular.');
      return;
    }

    sendWhatsAppNotification({
      phone,
      clientName: clientName || 'Cliente',
      templateType,
      customMessage: templateType === 'personalizado' ? customText : undefined,
      data: templateData,
    });

    setDispatched(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => {
      setDispatched(false);
      onClose();
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Notificación por WhatsApp</h3>
              <p className="text-xs text-neutral-400">Envío directo y seguro al cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Client & Phone selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ej. Roberto Gómez"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Número de WhatsApp (8 dígitos · El Salvador)</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+503 7000-0000"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Template pills */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Plantilla de Mensaje</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { type: 'ot_listo', label: '✅ Vehículo Listo' },
                { type: 'presupuesto', label: '📋 Presupuesto' },
                { type: 'cita', label: '📅 Cita Agendada' },
                { type: 'ot_inicio', label: '🔧 Reparación Iniciada' },
                { type: 'mantenimiento', label: '⚠️ Mantenimiento' },
                { type: 'personalizado', label: '✏️ Personalizado' },
              ].map(t => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setTemplateType(t.type as any)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors cursor-pointer ${
                    templateType === t.type
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {templateType === 'personalizado' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Mensaje Personalizado</label>
              <textarea
                rows={3}
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder="Escribe el mensaje para el cliente..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Vista previa de WhatsApp
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>
            </div>
            <div className="p-3 bg-neutral-950 border border-emerald-950/40 rounded-xl text-xs text-neutral-200 whitespace-pre-wrap font-sans leading-relaxed border-l-4 border-l-emerald-500 select-text">
              {preview}
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Al presionar "Enviar por WhatsApp", se abrirá automáticamente WhatsApp Web o la app oficial de WhatsApp en el dispositivo con el número y mensaje prellenados.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={dispatched}
            className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-900/40 cursor-pointer disabled:opacity-50"
          >
            {dispatched ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Enviado a WhatsApp!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Abrir y Enviar por WhatsApp</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

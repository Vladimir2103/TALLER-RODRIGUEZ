import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Cloud, Download, Upload, RefreshCw, CheckCircle2, ShieldCheck, X, HardDrive, Smartphone } from 'lucide-react';
import { WORKSHOP_CONFIG } from '../data/initialData';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaySplash: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose, onReplaySplash }) => {
  const {
    syncStatus,
    lastSyncedAt,
    triggerCloudSync,
    exportBackupData,
    importBackupData,
    resetToSampleData,
    resetToCleanData,
    connectedClients,
    isRealtimeConnected,
    clients,
    workOrders,
    budgets,
    parts,
    appointments,
    users,
  } = useWorkshop();

  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importBackupData(content);
      if (success) {
        setImportStatus('Copia de seguridad restaurada exitosamente.');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Error: El archivo JSON no es válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Sincronización en la Nube & Backup</h3>
              <p className="text-xs text-neutral-400">Taller Rodríguez Rodríguez · Conectividad Móvil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Box */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <div>
                <span className="text-white font-semibold block text-xs">Estado: Sincronizado en la Nube</span>
                <span className="text-[11px] text-neutral-400">Última sincronización: {lastSyncedAt}</span>
              </div>
            </div>

            <button
              onClick={triggerCloudSync}
              className="px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 bg-neutral-850 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Forzar Sync</span>
            </button>
          </div>

          {/* Database stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">Citas</span>
              <span className="font-mono text-white font-bold">{appointments.length}</span>
            </div>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">Órdenes OT</span>
              <span className="font-mono text-white font-bold">{workOrders.length}</span>
            </div>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">Repuestos</span>
              <span className="font-mono text-white font-bold">{parts.length}</span>
            </div>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">Clientes</span>
              <span className="font-mono text-white font-bold">{clients.length}</span>
            </div>
          </div>

          {/* Export & Import actions */}
          <div className="space-y-2 pt-2 border-t border-neutral-850">
            <span className="font-semibold text-white block">Respaldo y Portabilidad de Datos</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Server DB Download Button */}
              <a
                href="/api/database/backup"
                download
                className="p-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl flex items-center gap-2.5 text-left transition-colors cursor-pointer group no-underline"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block text-xs">Descargar BD Servidor</span>
                  <span className="text-[10px] text-neutral-400">Archivo JSON oficial (Render / Cloud)</span>
                </div>
              </a>

              {/* Import Button */}
              <label className="p-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl flex items-center gap-2.5 text-left transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 group-hover:bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block text-xs">Restaurar Copia</span>
                  <span className="text-[10px] text-neutral-400">Cargar y sincronizar base de datos</span>
                </div>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Storage Architecture Security Note */}
            <div className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-850 flex items-start gap-2 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium block">Base de Datos 100% Optimizada para Render</span>
                <span className="text-[10px] text-neutral-400">
                  Persistencia atómica con <code className="text-neutral-300">fsync</code>, respaldos automáticos rotativos en disco y recuperación instantánea ante reinicios de contenedor.
                </span>
              </div>
            </div>

            {importStatus && (
              <p className="text-xs text-emerald-400 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                {importStatus}
              </p>
            )}
          </div>

          {/* Workshop Details & Logo testing */}
          <div className="pt-2 border-t border-neutral-850 space-y-2">
            <span className="font-semibold text-white block">Acceso Móvil & Pantalla de Carga</span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Esta aplicación está optimizada con soporte PWA y almacenamiento local seguro con sincronización continua. Puedes añadirla a la pantalla de inicio de tu teléfono o tablet para utilizarla como aplicación nativa.
            </p>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReplaySplash();
                }}
                className="text-xs text-red-400 hover:text-red-300 underline underline-offset-4 cursor-pointer"
              >
                Ver pantalla de carga con logo original
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

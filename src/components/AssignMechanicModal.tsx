import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrder, User } from '../types';
import { Wrench, Crown, UserCheck, Bell, CheckCircle2, X, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AssignMechanicModalProps {
  order: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignMechanicModal: React.FC<AssignMechanicModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { users, workOrders, reassignWorkOrder, currentUser, hasPermission } = useWorkshop();

  const [selectedTechName, setSelectedTechName] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !order) return null;

  if (!hasPermission('canManageMechanics')) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Función Restringida</h3>
          <p className="text-xs text-neutral-400">
            Solo el Jefe de Taller o administradores autorizados pueden reasignar el técnico responsable de una orden.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Active technicians from registered users
  const activeMechanics = users.filter(u => u.isActive);

  const handleAssign = (techName: string) => {
    reassignWorkOrder(order.id, techName);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    setSuccessMsg(`¡Orden ${order.otNumber} asignada a ${techName}! Se envió la notificación en tiempo real.`);

    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Asignar Mecánico Responsable</h3>
              <p className="text-[11px] text-neutral-400">
                Selecciona quién realizará el trabajo en esta orden (notificación en tiempo real)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Details Brief Banner */}
        <div className="p-4 bg-neutral-950/80 border-b border-neutral-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-white text-sm">{order.otNumber}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              Placas: <strong className="text-white">{order.vehiclePlate}</strong>
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-neutral-300 font-medium">
            <span>🚗 {order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})</span>
            <span>·</span>
            <span>Cliente: {order.clientName}</span>
          </div>

          <p className="mt-1 text-[11px] text-neutral-400 line-clamp-1">
            <strong className="text-neutral-500">Falla reportada:</strong> {order.reportedFault}
          </p>

          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="text-neutral-400">Actualmente asignado a:</span>
            <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-semibold">
              {order.assignedTechnician}
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="m-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mechanics List */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="font-mono uppercase">Plantilla de mecánicos disponible:</span>
            <span className="text-red-400 font-medium flex items-center gap-1">
              <Bell className="w-3 h-3 animate-pulse" />
              Notificación automática
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {activeMechanics.map(m => {
              const isCurrentAssigned =
                order.assignedTechnician.toLowerCase().includes(m.name.toLowerCase()) ||
                m.name.toLowerCase().includes(order.assignedTechnician.toLowerCase());

              const activeCount = workOrders.filter(
                o =>
                  o.stage !== 'entregado' &&
                  (o.assignedTechnician.toLowerCase().includes(m.name.toLowerCase()) ||
                    m.name.toLowerCase().includes(o.assignedTechnician.toLowerCase()))
              ).length;

              const isBoss = m.role === 'boss';

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isCurrentAssigned
                      ? 'bg-red-950/20 border-red-500/50'
                      : 'bg-neutral-950 hover:bg-neutral-850/60 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                        isBoss ? 'bg-red-600' : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                      }`}
                    >
                      {isBoss ? <Crown className="w-4 h-4 text-amber-300" /> : <Wrench className="w-4 h-4 text-blue-400" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">{m.name}</span>
                        <span className="text-[10px] font-mono text-neutral-500">@{m.username}</span>
                        {isCurrentAssigned && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-bold">
                            Asignado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">{m.specialty}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 font-mono">
                        <span>Carga actual: <strong className="text-neutral-300">{activeCount} OTs en taller</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAssign(m.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isCurrentAssigned
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-950'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isCurrentAssigned ? 'Reasignar' : 'Asignar'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 flex items-center gap-2.5 text-[11px] text-neutral-400 mt-2">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Al asignar al mecánico, este recibirá una notificación emergente en tiempo real en su dispositivo y se registrará en su campana de avisos.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

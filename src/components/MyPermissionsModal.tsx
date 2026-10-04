import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Calendar,
  Wrench,
  FileText,
  Package,
  History,
  DollarSign,
  ShieldCheck,
  MessageSquare,
  Trash2,
  X,
  CheckCircle2,
  Lock,
  Crown,
  Info,
} from 'lucide-react';
import { MechanicPermissions } from '../types';

interface MyPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManageStaff?: () => void;
}

export const MyPermissionsModal: React.FC<MyPermissionsModalProps> = ({
  isOpen,
  onClose,
  onOpenManageStaff,
}) => {
  const { currentUser } = useWorkshop();

  if (!isOpen || !currentUser) return null;

  const isBoss = currentUser.role === 'boss';

  const PERMISSION_CONFIG: {
    key: keyof MechanicPermissions;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string;
  }[] = [
    {
      key: 'canManageAppointments',
      label: 'Citas & Agenda',
      desc: 'Agendar, modificar fecha/hora y cancelar citas de clientes',
      icon: Calendar,
      category: 'Atención al Cliente',
    },
    {
      key: 'canManageWorkOrders',
      label: 'Órdenes de Trabajo (OT)',
      desc: 'Crear órdenes, diagnósticos, piezas usadas y avanzar etapas de reparación',
      icon: Wrench,
      category: 'Taller & Operaciones',
    },
    {
      key: 'canManageBudgets',
      label: 'Presupuestos & Cotizaciones',
      desc: 'Generar presupuestos formales, cotizar repuestos y mano de obra',
      icon: FileText,
      category: 'Ventas & Cotizaciones',
    },
    {
      key: 'canManageInventory',
      label: 'Inventario de Repuestos',
      desc: 'Crear piezas, ajustar existencias de almacén, costos y precios de venta',
      icon: Package,
      category: 'Almacén & Repuestos',
    },
    {
      key: 'canManageClients',
      label: 'Clientes & Vehículos',
      desc: 'Registrar nuevos clientes, editar información de contacto y agregar autos',
      icon: History,
      category: 'Clientes & Flota',
    },
    {
      key: 'canViewFinancialReports',
      label: 'Informes Financieros',
      desc: 'Visualizar ingresos brutos, márgenes de utilidad y balances en dólares',
      icon: DollarSign,
      category: 'Finanzas & Métricas',
    },
    {
      key: 'canManageMechanics',
      label: 'Personal & Permisos',
      desc: 'Registrar nuevos mecánicos y configurar sus permisos (Reservado)',
      icon: ShieldCheck,
      category: 'Administración Taller',
    },
    {
      key: 'canSendWhatsApp',
      label: 'Mensajes WhatsApp',
      desc: 'Enviar notificaciones oficiales y avisos automáticos a clientes',
      icon: MessageSquare,
      category: 'Comunicación',
    },
    {
      key: 'canDeleteRecords',
      label: 'Eliminar Registros',
      desc: 'Borrar permanentemente órdenes, citas, presupuestos, clientes o repuestos',
      icon: Trash2,
      category: 'Seguridad de Datos',
    },
  ];

  const activeCount = isBoss
    ? PERMISSION_CONFIG.length
    : Object.values(currentUser.permissions || {}).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                isBoss ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {isBoss ? <Crown className="w-5 h-5 text-amber-300" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Mis Roles y Permisos Asignados</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    isBoss
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {isBoss ? 'Jefe de Taller' : 'Mecánico / Técnico'}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Usuario activo: <strong className="text-neutral-200">{currentUser.name}</strong> (@{currentUser.username})
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

        {/* Status bar */}
        <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300 font-mono text-[11px]">
              {isBoss ? (
                <strong className="text-amber-300">Control Total Máster: 9 de 9 permisos habilitados</strong>
              ) : (
                <>
                  Estado de cuenta: <strong className="text-white">{activeCount} de 9 permisos autorizados</strong>
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            {isBoss ? 'Sin restricciones' : `${9 - activeCount} módulos bloqueados`}
          </span>
        </div>

        {/* Explanation Note */}
        {!isBoss && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850 flex items-start gap-2.5 text-xs text-neutral-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Tu acceso está estrictamente controlado por el Jefe de Taller. Solo puedes interactuar con los módulos y acciones marcadas en verde como <strong className="text-emerald-400">AUTORIZADO</strong>. El resto de las áreas y funciones permanecen bloqueadas.
            </p>
          </div>
        )}

        {/* Permissions List */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto max-h-[60vh]">
          {PERMISSION_CONFIG.map(item => {
            const hasIt = isBoss || Boolean(currentUser.permissions?.[item.key]);
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  hasIt
                    ? 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-950/30 border-neutral-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      hasIt
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-neutral-900 text-neutral-600 border border-neutral-850'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-xs ${hasIt ? 'text-white' : 'text-neutral-400'}`}>
                        {item.label}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {hasIt ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>AUTORIZADO</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500 font-mono text-[10px] font-bold">
                      <Lock className="w-3 h-3 text-neutral-500" />
                      <span>BLOQUEADO</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3 text-xs">
          {isBoss && onOpenManageStaff ? (
            <button
              onClick={() => {
                onClose();
                onOpenManageStaff();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrar Permisos del Personal</span>
            </button>
          ) : (
            <span className="text-[11px] text-neutral-500">
              Solicita ampliación de permisos a Carlos Rodríguez (Jefe)
            </span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors cursor-pointer ml-auto"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

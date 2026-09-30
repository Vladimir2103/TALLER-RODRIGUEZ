import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { MechanicAssignmentNotification } from '../types';
import { Bell, CheckCheck, Wrench, X, ExternalLink, Clock, Car, User, AlertCircle } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (otId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const {
    mechanicNotifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    currentUser,
  } = useWorkshop();

  if (!isOpen) return null;

  // Filter notifications: show for current user or all if boss
  const isBoss = currentUser?.role === 'boss';
  const filteredNotifications = mechanicNotifications.filter(n => {
    if (isBoss) return true;
    if (!currentUser?.name) return true;
    return n.technicianName.toLowerCase().includes(currentUser.name.toLowerCase());
  });

  const handleMarkAllRead = () => {
    markNotificationsAsRead();
  };

  const handleNotificationClick = (n: MechanicAssignmentNotification) => {
    markNotificationsAsRead(n.technicianName);
    if (onSelectOrder) {
      onSelectOrder(n.otId);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col text-neutral-100 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Notificaciones en Tiempo Real</h3>
                {unreadNotificationsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold">
                    {unreadNotificationsCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {isBoss
                  ? 'Asignaciones de órdenes de trabajo del taller'
                  : `Órdenes asignadas a ${currentUser?.name || 'ti'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Mark as Read & User Context */}
        <div className="px-5 py-2.5 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-neutral-400">
            {filteredNotifications.length} aviso(s) registrado(s)
          </span>

          {unreadNotificationsCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer hover:underline transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-neutral-700 stroke-1" />
              <p className="text-xs font-medium text-neutral-400">No tienes notificaciones pendientes</p>
              <p className="text-[11px] text-neutral-600 max-w-xs mx-auto">
                Cuando el Jefe de Taller o el sistema te asigne una orden de trabajo, aparecerá aquí al instante en tiempo real.
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => {
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                    !item.read
                      ? 'bg-neutral-950 border-red-500/40 hover:border-red-500/80 shadow-sm shadow-red-950/20'
                      : 'bg-neutral-950/60 border-neutral-850 hover:border-neutral-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white group-hover:text-red-400 transition-colors">
                        {item.otNumber}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {item.vehiclePlate}
                      </span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                      )}
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.createdAt.split(' ')[1] || item.createdAt}
                    </span>
                  </div>

                  {/* Vehicle & Client Info */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-200 font-medium">
                    <Car className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{item.vehicleModel}</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-400 truncate">{item.clientName}</span>
                  </div>

                  {/* Problem */}
                  <p className="mt-1 text-[11px] text-neutral-400 line-clamp-2 bg-neutral-900/60 p-1.5 rounded-lg border border-neutral-850/80">
                    <strong className="text-neutral-300 font-medium">Trabajo:</strong> {item.reportedFault}
                  </p>

                  {/* Footer */}
                  <div className="mt-2.5 pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <User className="w-3 h-3 text-neutral-400" />
                      Asignado a: <strong className="text-neutral-300">{item.technicianName}</strong>
                    </span>

                    <span className="text-red-400 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Ver Orden</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 text-center text-[10px] text-neutral-500 font-mono">
          Sincronización en vivo vía WebSockets & Nube Rodríguez
        </div>
      </div>
    </>
  );
};

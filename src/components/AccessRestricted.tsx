import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

interface AccessRestrictedProps {
  sectionName: string;
  requiredPermission: string;
  onGoBack: () => void;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  sectionName,
  requiredPermission,
  onGoBack,
}) => {
  const { currentUser } = useWorkshop();

  return (
    <div className="py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Módulo Protegido</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Acceso No Autorizado</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Tu cuenta actual no tiene activado el permiso para acceder al módulo de{' '}
            <strong className="text-neutral-200">{sectionName}</strong>.
          </p>
        </div>

        {currentUser && (
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-left text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Usuario conectado:</span>
              <strong className="text-white flex items-center gap-1 font-sans">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                {currentUser.name}
              </strong>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Rol actual:</span>
              <span className="text-amber-400 font-semibold font-sans">
                {currentUser.role === 'boss' ? 'Jefe de Taller' : 'Mecánico / Técnico'}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Permiso requerido:</span>
              <span className="text-red-400 font-mono text-[11px]">{requiredPermission}</span>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-neutral-850/60 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed text-left">
          💡 <strong className="text-neutral-300">¿Necesitas operar en esta área?</strong>
          <p className="mt-0.5">
            Solicita a <strong className="text-white">Carlos Rodríguez (Jefe de Taller)</strong> que active tu casilla de verificación correspondiente desde el panel de <em>Mecánicos & Permisos</em>.
          </p>
        </div>

        <button
          onClick={onGoBack}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Panel Principal</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'login' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success && isAndroid) {
        setShowAndroidGuide(true);
      }
    } else if (isAndroid) {
      setShowAndroidGuide(true);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowAndroidGuide(true);
    }
  };

  const renderButtonContent = () => {
    if (variant === 'login') {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Descargar / Instalar App en tu Android</span>
        </button>
      );
    }

    if (variant === 'banner') {
      return (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">Instalar en tu Celular Android</p>
              <p className="text-[11px] text-neutral-400 truncate">Acceso rápido sin escribir la dirección web</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
          >
            Instalar
          </button>
        </div>
      );
    }

    // Default 'header' or 'compact'
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs ${className}`}
        title="Instalar como aplicación en tu teléfono Android o computadora"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">App</span>
      </button>
    );
  };

  return (
    <>
      {renderButtonContent()}

      {/* Android Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Instalar App en Android</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-300">
              Puedes instalar el sistema de <strong>Taller Rodríguez Rodríguez</strong> directamente desde el navegador de tu teléfono Android (Chrome, Edge, Samsung Internet, etc.):
            </p>

            <div className="space-y-2.5 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-neutral-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha del navegador Chrome.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Selecciona la opción <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  Confirma <strong>&quot;Instalar&quot;</strong>. ¡La app aparecerá en tu teléfono con su icono oficial!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white">Instalar en iPhone / iPad</h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-300">
              Para instalar en Safari en tu dispositivo Apple:
            </p>

            <div className="space-y-2.5 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-neutral-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>Desplázate hacia abajo y selecciona <strong>&quot;Agregar a inicio&quot;</strong>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

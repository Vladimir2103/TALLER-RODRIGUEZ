import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Eye,
  EyeOff,
  Wrench,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
}) => {
  const { login } = useWorkshop();

  const [identifier, setIdentifier] = useState('');
  const [passOrPin, setPassOrPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Por favor ingresa tu usuario o correo electrónico.');
      return;
    }

    if (!passOrPin.trim()) {
      setErrorMsg('Por favor ingresa tu PIN o contraseña.');
      return;
    }

    setIsLoading(true);

    const res = login(identifier, passOrPin);
    if (!res.success) {
      setErrorMsg(res.message || 'Credenciales incorrectas. Verifica tus datos de acceso.');
      setIsLoading(false);
    } else {
      setSuccessMsg('Acceso autorizado. Cargando sistema...');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => {
        setIsLoading(false);
        if (onClose) onClose();
      }, 400);
    }
  };

  const containerClasses = isMandatory
    ? 'fixed inset-0 z-50 overflow-y-auto bg-neutral-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 antialiased selection:bg-red-600/30 selection:text-white min-h-screen'
    : 'fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 antialiased selection:bg-red-600/30 selection:text-white min-h-screen';

  return (
    <div className={containerClasses}>
      {/* Background subtle radial spotlight */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(220,38,38,0.2),rgba(0,0,0,0))]" />

      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto z-10 transition-all">
        {/* Optional close button only if not mandatory */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-800 cursor-pointer z-20 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Official Workshop Logo Header - Untouched official logo without distortion */}
        <div className="p-6 sm:p-7 bg-gradient-to-b from-black via-neutral-950 to-neutral-900 border-b border-neutral-800/80 text-center relative">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Taller Automotriz Rodríguez Rodríguez"
              className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 object-contain rounded-2xl drop-shadow-2xl select-none"
              loading="eager"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>ACCESO SEGURO AL SISTEMA</span>
          </div>

          <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
            Taller Rodríguez Rodríguez
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xs sm:max-w-sm mx-auto">
            Ingresa tus credenciales autorizadas para acceder al taller.
          </p>
        </div>

        {/* Feedback Alert Messages */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Secure Clean Login Form - No demo credentials leaked */}
        <div className="p-5 sm:p-7 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-neutral-200 mb-1.5">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Ingresa tu usuario o correo"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-neutral-200 mb-1.5">
                PIN o Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passOrPin}
                  onChange={e => setPassOrPin(e.target.value)}
                  placeholder="Ingresa tu PIN o contraseña"
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer p-1"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl text-sm sm:text-base transition-colors cursor-pointer shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 select-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando acceso...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security / System Footer Note */}
        <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-neutral-400 font-mono">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <Wrench className="w-3.5 h-3.5 text-red-500" />
            <span>App creada por <strong className="text-white font-bold">VlaSwink51</strong></span>
          </span>
          <span className="text-neutral-400 font-semibold">El Salvador, Usulután</span>
        </div>
      </div>
    </div>
  );
};

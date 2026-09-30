import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Logo } from './Logo';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Wrench,
  Crown,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
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
  const { users, currentUser, login, loginAsDemo } = useWorkshop();

  const [mode, setMode] = useState<'quick' | 'form'>('quick');
  const [identifier, setIdentifier] = useState('');
  const [passOrPin, setPassOrPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = login(identifier, passOrPin);
    if (!res.success) {
      setErrorMsg(res.message || 'Error al iniciar sesión.');
    } else {
      setSuccessMsg('¡Bienvenido al sistema!');
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    }
  };

  const handleQuickLogin = (userId: string) => {
    setErrorMsg('');
    loginAsDemo(userId);
    const user = users.find(u => u.id === userId);
    setSuccessMsg(`Sesión iniciada como ${user?.name || 'Usuario'}`);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => {
      if (onClose) onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative text-neutral-100">
        {/* Close button if optional */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 cursor-pointer z-10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Header */}
        <div className="p-6 bg-gradient-to-b from-neutral-950 to-neutral-900 border-b border-neutral-800 text-center relative">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neutral-900 border border-neutral-800 p-2 shadow-inner flex items-center justify-center">
            <Logo variant="icon" theme="dark" showText={false} className="w-full h-full" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-red-500 font-bold uppercase block mb-1">
            CONTROL DE ACCESO & PERMISOS
          </span>
          <h2 className="text-xl font-extrabold tracking-tight text-white uppercase font-sans">
            Taller Rodríguez Rodríguez
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            Inicia sesión como Jefe de Taller o como Mecánico para acceder con tus permisos correspondientes.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center mt-4 bg-neutral-950 p-1 rounded-xl border border-neutral-800 max-w-xs mx-auto">
            <button
              onClick={() => {
                setMode('quick');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'quick'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Acceso Rápido</span>
            </button>
            <button
              onClick={() => {
                setMode('form');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'form'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-red-400" />
              <span>Usuario y PIN</span>
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6">
          {mode === 'quick' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                <span className="font-mono uppercase">Selecciona un perfil para ingresar:</span>
                <span className="text-amber-400 font-medium">1 Clic</span>
              </div>

              <div className="space-y-2.5">
                {users.map(u => {
                  const isCurrent = currentUser?.id === u.id;
                  const isBoss = u.role === 'boss';

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleQuickLogin(u.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-red-950/20 border-red-500/60 ring-1 ring-red-500/40'
                          : 'bg-neutral-950 hover:bg-neutral-800/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                            isBoss ? 'bg-red-600 shadow-sm shadow-red-900' : 'bg-neutral-800 text-neutral-200'
                          }`}
                        >
                          {isBoss ? <Crown className="w-5 h-5 text-amber-300" /> : <Wrench className="w-4 h-4 text-blue-400" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white truncate">{u.name}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                isBoss
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {isBoss ? 'Jefe / Admin' : 'Mecánico'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{u.specialty}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500 font-mono flex-wrap">
                            <span className="text-neutral-300 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                              Usuario: <strong className="text-white">@{u.username}</strong>
                            </span>
                            <span>·</span>
                            <span>PIN: <strong className="text-amber-400 font-bold">{u.pin}</strong></span>
                            <span>·</span>
                            <span className="text-neutral-400">
                              {isBoss
                                ? 'Acceso Total'
                                : u.permissions.canManageBudgets
                                ? 'OTs, Citas, Presupuestos'
                                : 'OTs y Citas'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-neutral-400 shrink-0 font-medium group-hover:text-white">
                        <span>Entrar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="carlos.jefe o miguel.rodriguez"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  PIN de 4 dígitos o Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="password"
                    required
                    value={passOrPin}
                    onChange={e => setPassOrPin(e.target.value)}
                    placeholder="Ej. 1234 (Jefe) o 2345 (Miguel)"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Pistas demo: Carlos (PIN: <strong>1234</strong>), Miguel (PIN: <strong>2345</strong>), Andrés (PIN: <strong>3456</strong>), Roberto (PIN: <strong>4567</strong>).
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-md shadow-red-950 flex items-center justify-center gap-2 mt-2"
              >
                <Lock className="w-4 h-4" />
                <span>Ingresar al Taller</span>
              </button>
            </form>
          )}

          {/* Active session footer indicator */}
          {currentUser && (
            <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  Sesión activa: <strong className="text-white">{currentUser.name}</strong>
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
                {currentUser.role === 'boss' ? 'Jefe General' : 'Mecánico'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

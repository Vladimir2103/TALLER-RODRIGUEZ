import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { User, Lock, KeyRound, CheckCircle2, AlertCircle, X, Shield, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, users } = useWorkshop();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setUsername(currentUser.username);
      setPin(currentUser.pin);
      setPhone(currentUser.phone);
      setEmail(currentUser.email);
      setSpecialty(currentUser.specialty);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      setErrorMsg('El nombre de usuario no puede estar vacío.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMsg('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    // Check if another user has this username
    const existsOther = users.some(
      u => u.id !== currentUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (existsOther) {
      setErrorMsg(`El nombre de usuario "@${cleanUsername}" ya está en uso por otro miembro del taller.`);
      return;
    }

    if (!pin || pin.length < 4) {
      setErrorMsg('El PIN debe tener 4 dígitos numéricos.');
      return;
    }

    updateUser(currentUser.id, {
      name: name.trim(),
      username: cleanUsername,
      pin,
      phone: phone.trim(),
      email: email.trim(),
      specialty: specialty.trim(),
    });

    confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
    setSuccessMsg(`¡Credenciales actualizadas! Ahora puedes iniciar sesión con tu usuario @${cleanUsername}`);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Modificar mi Usuario & Credenciales</h3>
              <p className="text-[11px] text-neutral-400">Cambia tu nombre de usuario para ingresar al login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Username Field with prominent display */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white">
                Nombre de Usuario (@login)
              </label>
              <span className="text-[10px] text-amber-400 font-mono font-semibold">Credencial de acceso</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="ej. miguel.rodriguez"
                className="w-full pl-7 pr-3 py-2 bg-neutral-900 border border-neutral-750 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              💡 Este es el texto que ingresarás en la casilla <strong className="text-neutral-200">"Usuario o Correo"</strong> al iniciar sesión.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">PIN de Acceso (4 dígitos)</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-center tracking-widest focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Especialidad</label>
            <input
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer shadow-md shadow-red-950 transition-colors"
            >
              Guardar Credenciales
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

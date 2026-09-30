import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { Cloud, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, forceShow = false }) => {
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState('Iniciando sistema central...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage('Sincronizando base de datos en la nube...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStatusMessage('Cargando inventario, citas y órdenes activas...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusMessage('Sistema Taller Rodríguez Rodríguez listo');
      setIsReady(true);
    }, 1400);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 1900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white px-6 py-10 overflow-hidden select-none"
    >
      {/* Ambient background glow & car headlights simulation */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-b from-amber-500/10 via-red-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      
      {/* Top Bar subtle status */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 text-xs tracking-wider text-neutral-400 uppercase font-mono"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Taller Management Cloud OS</span>
        <span className="text-neutral-600">·</span>
        <span className="text-neutral-500">v2.6 PRO</span>
      </motion.div>

      {/* Main Logo Centerpiece */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md relative">
        {/* Headlight beam sweeps */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: [0, 0.8, 0.4], x: [ -60, 40, 0] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute -top-10 -left-10 w-48 h-32 bg-amber-200/10 blur-xl transform -rotate-12 pointer-events-none"
        />

        {/* The Authentic Logo */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex items-center justify-center"
        >
          <Logo className="w-full max-w-[340px] sm:max-w-[400px]" theme="dark" showText={true} />
        </motion.div>

        {/* Tagline under logo */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-xs sm:text-sm text-neutral-400 font-medium tracking-widest uppercase text-center"
        >
          Mecánica Especializada · Citas · Inventario · Presupuestos
        </motion.p>
      </div>

      {/* Bottom Progress Bar & Cloud Status */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        {/* Progress track */}
        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/80">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Status text */}
        <div className="w-full flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 truncate">
            {isReady ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-amber-400 animate-bounce shrink-0" />
            )}
            <span className="truncate">{statusMessage}</span>
          </div>
          <span className="font-mono text-neutral-300 font-semibold">{progress}%</span>
        </div>

        {/* Skip button for quick testing */}
        <button
          onClick={onComplete}
          className="text-[11px] text-neutral-500 hover:text-neutral-300 underline underline-offset-4 transition-colors pt-1 cursor-pointer"
        >
          Entrar directamente al panel
        </button>
      </div>
    </motion.div>
  );
};

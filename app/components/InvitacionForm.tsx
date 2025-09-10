"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, ArrowLeft, ArrowRight, Users, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface InvitacionFormProps {
  onBack: () => void;
  onNext: (invitationCode: string) => void;
  isLoading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const InvitacionForm: React.FC<InvitacionFormProps> = ({ onBack, onNext, isLoading = false }) => {
  const [invitationCode, setInvitationCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationCode.trim()) {
      toast.error("Por favor ingresa el código de invitación");
      return;
    }

    setIsValidating(true);
    
    try {
      // Llamar al servicio de validación real
      onNext(invitationCode);
    } catch {
      toast.error("Error al validar el código. Intenta nuevamente.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl"
          >
            <Key size={40} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Código de Invitación
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Ingresa el código que recibiste de tu administrador de comunidad para validar tu acceso
          </p>
        </div>
      </motion.div>

      {/* Información de la comunidad simulada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-8"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">Beneficios de unirte</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-400" />
                <span>Reportar denuncias de forma anónima</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-400" />
                <span>Seguimiento en tiempo real</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-400" />
                <span>Comunicación directa con administradores</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-400" />
                <span>Notificaciones de incidentes relevantes</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Código de Invitación
          </label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
            <input
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
              className="w-full pl-12 pr-4 py-4 bg-zinc-700/50 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-lg tracking-wider font-mono"
              placeholder="INGRESA-TU-CODIGO"
              required
              disabled={isValidating}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            El código distingue entre mayúsculas y minúsculas
          </p>
        </motion.div>

        <motion.button
          type="submit"
          disabled={isValidating}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isValidating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              <span>Validando código...</span>
            </>
          ) : (
            <>
              <span>Validar y Continuar</span>
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-6 text-sm text-zinc-500"
      >
        <p>¿No tienes un código? Contacta al administrador de tu comunidad</p>
      </motion.div>
    </div>
  );
};

export default InvitacionForm;

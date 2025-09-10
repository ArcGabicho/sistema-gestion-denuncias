"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { DenunciaPublica, Denunciante } from "@/app/interfaces/DenunciaPublica";

interface DatosDenuncianteProps {
  formData: Partial<DenunciaPublica>;
  onBack: () => void;
  onSubmit: (data: { denunciante: Denunciante }) => void;
}

const DatosDenunciante: React.FC<DatosDenuncianteProps> = ({ formData, onBack, onSubmit }) => {
  const [nombre, setNombre] = useState(formData.denunciante?.nombre || "");
  const [apellido, setApellido] = useState(formData.denunciante?.apellido || "");
  const [email, setEmail] = useState(formData.denunciante?.email || "");
  const [telefono, setTelefono] = useState(formData.denunciante?.telefono || "");
  const [anonimo, setAnonimo] = useState(formData.denunciante?.anonimo || false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!anonimo) {
      if (!nombre.trim()) {
        newErrors.nombre = "El nombre es requerido";
      } else if (nombre.trim().length < 2) {
        newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
      }

      if (!apellido.trim()) {
        newErrors.apellido = "El apellido es requerido";
      } else if (apellido.trim().length < 2) {
        newErrors.apellido = "El apellido debe tener al menos 2 caracteres";
      }

      if (!email.trim()) {
        newErrors.email = "El email es requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Ingrese un email válido";
      }

      if (telefono && !/^\+?[\d\s\-\(\)]{8,15}$/.test(telefono)) {
        newErrors.telefono = "Ingrese un teléfono válido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const denuncianteData = {
        denunciante: anonimo ? {
          anonimo: true,
          nombre: "Anónimo",
          apellido: "",
          email: "",
          telefono: ""
        } : {
          anonimo: false,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          telefono: telefono.trim()
        }
      };

      // Enviar toda la información completa de la denuncia
      onSubmit(denuncianteData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <User size={24} className="text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Datos del Denunciante</h2>
        <p className="text-zinc-400">Proporciona tus datos de contacto o realiza una denuncia anónima</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Opción anónima */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-700/30 rounded-xl p-4 border border-zinc-600/50"
        >
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={anonimo}
              onChange={(e) => setAnonimo(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <div>
              <span className="text-white font-medium">Realizar denuncia anónima</span>
              <p className="text-zinc-400 text-sm">Tu identidad se mantendrá en privado</p>
            </div>
          </label>
        </motion.div>

        {/* Campos de datos personales */}
        {!anonimo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <User size={16} />
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={`w-full p-4 rounded-xl bg-zinc-700/50 border ${
                    errors.nombre ? "border-red-500" : "border-zinc-600"
                  } text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Tu nombre"
                />
                {errors.nombre && (
                  <p className="text-red-400 text-sm">{errors.nombre}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-zinc-300">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className={`w-full p-4 rounded-xl bg-zinc-700/50 border ${
                    errors.apellido ? "border-red-500" : "border-zinc-600"
                  } text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Tu apellido"
                />
                {errors.apellido && (
                  <p className="text-red-400 text-sm">{errors.apellido}</p>
                )}
              </motion.div>
            </div>

            {/* Email */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Mail size={16} />
                Correo electrónico *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-4 rounded-xl bg-zinc-700/50 border ${
                  errors.email ? "border-red-500" : "border-zinc-600"
                } text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email}</p>
              )}
              <p className="text-zinc-500 text-xs">
                Te contactaremos para darte seguimiento a tu denuncia
              </p>
            </motion.div>

            {/* Teléfono */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Phone size={16} />
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={`w-full p-4 rounded-xl bg-zinc-700/50 border ${
                  errors.telefono ? "border-red-500" : "border-zinc-600"
                } text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                placeholder="+57 300 123 4567"
              />
              {errors.telefono && (
                <p className="text-red-400 text-sm">{errors.telefono}</p>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Mensaje de confirmación para denuncias anónimas */}
        {anonimo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-blue-300 font-medium">Denuncia anónima activada</p>
                <p className="text-zinc-400 text-sm">
                  Tu identidad permanecerá completamente privada. No podremos contactarte para seguimiento.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <motion.button
            type="button"
            onClick={onBack}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            Atrás
          </motion.button>
          
          <motion.button
            type="submit"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Enviar Denuncia
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default DatosDenunciante;

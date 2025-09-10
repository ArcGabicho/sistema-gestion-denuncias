/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building, FileText, MapPin, ArrowRight, ArrowLeft } from "lucide-react";

interface StepFormProps {
  formData: any;
  next: (data: any) => void;
  back: () => void;
  isFirst: boolean;
  isLast: boolean;
  isLoading?: boolean;
}

const DatosComunidadForm: React.FC<StepFormProps> = ({ formData, next, back, isLast, isLoading = false }) => {
  const [nombre, setNombre] = useState(formData.nombre || "");
  const [descripcion, setDescripcion] = useState(formData.descripcion || "");
  const [direccion, setDireccion] = useState(formData.direccion || "");
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!nombre || !direccion) {
      newErrors.general = "Los campos marcados con * son obligatorios";
    }

    if (nombre && nombre.length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    if (descripcion && descripcion.length < 10) {
      newErrors.descripcion = "La descripción debe tener al menos 10 caracteres";
    }

    if (direccion && direccion.length < 5) {
      newErrors.direccion = "La dirección debe tener al menos 5 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    next({
      nombre,
      descripcion,
      direccion,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl">
          <Building size={32} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Datos de la Comunidad
        </h2>
        <p className="text-zinc-400">
          Registra la información de tu comunidad residencial
        </p>
      </motion.div>

      {/* Mostrar errores generales */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-300 text-sm">{errors.general}</p>
        </motion.div>
      )}

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        {/* Nombre de la Comunidad */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Nombre de la Comunidad *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-12 pr-4 py-3 bg-zinc-700/50 border rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.nombre ? 'border-red-500/50' : 'border-zinc-600/50'
              }`}
              placeholder="Ej: Residencial Los Robles"
              required
            />
          </div>
          {errors.nombre && (
            <p className="text-red-300 text-xs mt-1">{errors.nombre}</p>
          )}
        </motion.div>

        {/* Descripción */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Descripción de la Comunidad *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-blue-400" size={20} />
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={isLoading}
              rows={4}
              className={`w-full pl-12 pr-4 py-3 bg-zinc-700/50 border rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.descripcion ? 'border-red-500/50' : 'border-zinc-600/50'
              }`}
              placeholder="Describe tu comunidad: características, amenidades, tipo de viviendas, ubicación, etc."
              required
            />
          </div>
          {errors.descripcion && (
            <p className="text-red-300 text-xs mt-1">{errors.descripcion}</p>
          )}
          <p className="text-zinc-500 text-xs mt-1">Mínimo 10 caracteres</p>
        </motion.div>

        {/* Dirección */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Dirección *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-12 pr-4 py-3 bg-zinc-700/50 border rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.direccion ? 'border-red-500/50' : 'border-zinc-600/50'
              }`}
              placeholder="Ej: Av. Principal 123, Sector Norte, Ciudad"
              required
            />
          </div>
          {errors.direccion && (
            <p className="text-red-300 text-xs mt-1">{errors.direccion}</p>
          )}
        </motion.div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <motion.button
            type="button"
            onClick={back}
            disabled={isLoading}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} />
            <span>Anterior</span>
          </motion.button>

          <motion.button
            type="submit"
            disabled={isLoading}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span>{isLast ? "Crear Comunidad" : "Continuar"}</span>
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
};

export default DatosComunidadForm;
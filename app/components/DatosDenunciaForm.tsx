"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle } from "lucide-react";
import { DenunciaPublica } from "@/app/interfaces/DenunciaPublica";

interface DatosDenunciaFormProps {
  formData: Partial<DenunciaPublica>;
  onNext: (data: Partial<DenunciaPublica>) => void;
}

const DatosDenunciaForm: React.FC<DatosDenunciaFormProps> = ({ formData, onNext }) => {
  const [titulo, setTitulo] = useState(formData.titulo || "");
  const [descripcion, setDescripcion] = useState(formData.descripcion || "");
  const [categoria, setCategoria] = useState(formData.categoria || "");
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const categorias = [
    { value: "ruido", label: "Ruido excesivo", description: "Música alta, construcción, fiestas" },
    { value: "seguridad", label: "Problemas de seguridad", description: "Iluminación, robos, vandalismo" },
    { value: "basura", label: "Manejo de basura", description: "Acumulación, mal olor, contenedores" },
    { value: "transito", label: "Problemas de tránsito", description: "Estacionamiento ilegal, velocidad excesiva" },
    { value: "infraestructura", label: "Infraestructura", description: "Calles, aceras, alcantarillado" },
    { value: "servicios", label: "Servicios públicos", description: "Agua, electricidad, internet" },
    { value: "vandalismo", label: "Vandalismo", description: "Daños a propiedad, grafiti" },
    { value: "animales", label: "Problemas con animales", description: "Mascotas sin control, animales callejeros" },
    { value: "vecinos", label: "Conflictos vecinales", description: "Disputas, comportamiento inadecuado" },
    { value: "emergencia", label: "Emergencia", description: "Situaciones que requieren atención inmediata" },
    { value: "otro", label: "Otro", description: "Otros problemas no listados" }
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!titulo.trim()) {
      newErrors.titulo = "El título es requerido";
    } else if (titulo.trim().length < 5) {
      newErrors.titulo = "El título debe tener al menos 5 caracteres";
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = "La descripción es requerida";
    } else if (descripcion.trim().length < 20) {
      newErrors.descripcion = "La descripción debe tener al menos 20 caracteres";
    }

    if (!categoria) {
      newErrors.categoria = "Selecciona una categoría";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria: categoria as DenunciaPublica['categoria']
      });
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
          className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <FileText size={24} className="text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Datos de la Denuncia</h2>
        <p className="text-zinc-400">Describe el problema que quieres reportar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-zinc-300">
            Título de la denuncia *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={`w-full p-4 rounded-xl bg-zinc-700/50 border ${
              errors.titulo ? "border-red-500" : "border-zinc-600"
            } text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            placeholder="Ej: Ruido excesivo en las noches"
            maxLength={100}
          />
          <div className="flex justify-between items-center">
            {errors.titulo ? (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={16} />
                {errors.titulo}
              </p>
            ) : (
              <p className="text-zinc-500 text-sm">
                Sé específico y claro en el título
              </p>
            )}
            <span className="text-zinc-500 text-sm">
              {titulo.length}/100
            </span>
          </div>
        </motion.div>

        {/* Descripción */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-zinc-300">
            Descripción detallada *
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={`w-full p-4 rounded-xl bg-zinc-700/50 border ${
              errors.descripcion ? "border-red-500" : "border-zinc-600"
            } text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none`}
            placeholder="Describe detalladamente el problema: qué está pasando, cuándo ocurre, cómo te afecta..."
            rows={5}
            maxLength={1000}
          />
          <div className="flex justify-between items-center">
            {errors.descripcion ? (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={16} />
                {errors.descripcion}
              </p>
            ) : (
              <p className="text-zinc-500 text-sm">
                Incluye todos los detalles relevantes
              </p>
            )}
            <span className="text-zinc-500 text-sm">
              {descripcion.length}/1000
            </span>
          </div>
        </motion.div>

        {/* Categoría */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-zinc-300">
            Categoría del problema *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categorias.map((cat) => (
              <motion.label
                key={cat.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  categoria === cat.value
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-600 bg-zinc-700/30 hover:border-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  name="categoria"
                  value={cat.value}
                  checked={categoria === cat.value}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="sr-only"
                />
                <span className="text-white font-medium text-sm">
                  {cat.label}
                </span>
                <span className="text-zinc-400 text-xs mt-1">
                  {cat.description}
                </span>
                {categoria === cat.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </motion.div>
                )}
              </motion.label>
            ))}
          </div>
          {errors.categoria && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle size={16} />
              {errors.categoria}
            </p>
          )}
        </motion.div>

        {/* Botón Continuar */}
        <motion.button
          type="submit"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Continuar
        </motion.button>
      </form>
    </motion.div>
  );
};

export default DatosDenunciaForm;

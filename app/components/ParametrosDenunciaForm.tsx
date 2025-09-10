"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Upload, ArrowLeft, Trash2, FileText, Image, Video, File, RotateCcw } from "lucide-react";
import { Evidencia, DenunciaPublica } from "@/app/interfaces/DenunciaPublica";

interface ParametrosDenunciaFormProps {
  formData: Partial<DenunciaPublica>;
  onNext: (data: Partial<DenunciaPublica>) => void;
  onBack: () => void;
}

const ParametrosDenunciaForm: React.FC<ParametrosDenunciaFormProps> = ({ formData, onNext, onBack }) => {
  const [ubicacion, setUbicacion] = useState(formData.ubicacion || "");
  const [fechaIncidente, setFechaIncidente] = useState(
    typeof formData.fechaIncidente === 'string' 
      ? formData.fechaIncidente 
      : formData.fechaIncidente?.toString().split('T')[0] || ""
  );
  const [evidencias, setEvidencias] = useState<Evidencia[]>(formData.evidencias || []);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nuevaEvidencia, setNuevaEvidencia] = useState({
    url: "",
    tipo: "imagen" as "imagen" | "video" | "documento" | "audio" | "otro",
    nombre: ""
  });

  // Función para obtener dirección desde coordenadas
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Limpiar y formatear la dirección
        let address = data.display_name;
        
        // Si tenemos datos estructurados, crear una dirección más legible
        if (data.address) {
          const addr = data.address;
          const parts = [];
          
          // Agregar calle y número si están disponibles
          if (addr.house_number && addr.road) {
            parts.push(`${addr.road} ${addr.house_number}`);
          } else if (addr.road) {
            parts.push(addr.road);
          }
          
          // Agregar barrio o zona
          if (addr.neighbourhood || addr.suburb || addr.quarter) {
            parts.push(addr.neighbourhood || addr.suburb || addr.quarter);
          }
          
          // Agregar ciudad
          if (addr.city || addr.town || addr.village) {
            parts.push(addr.city || addr.town || addr.village);
          }
          
          // Agregar departamento/estado
          if (addr.state) {
            parts.push(addr.state);
          }
          
          if (parts.length > 0) {
            address = parts.join(", ");
          }
        }
        
        return address;
      }
      return "Dirección no encontrada";
    } catch (error) {
      console.error("Error en reverse geocoding:", error);
      return "Error al obtener dirección";
    }
  };

  // Función para recargar ubicación
  const recargarUbicacion = () => {
    setUbicacion("");
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      setUbicacion("Geolocalización no soportada en este navegador");
      setIsLoadingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          setUbicacion(address);
        } catch (error) {
          console.error("Error al obtener dirección:", error);
          setUbicacion("Error al obtener dirección - Ingresa manualmente");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        setUbicacion("Ubicación no disponible - Ingresa manualmente");
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Forzar nueva ubicación
      }
    );
  };

  // Autocompletar ubicación con dirección legible
  useEffect(() => {
    // Función para obtener ubicación actual
    const obtenerUbicacionActual = async () => {
      if (!navigator.geolocation) {
        setUbicacion("Geolocalización no soportada en este navegador");
        return;
      }

      setIsLoadingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const address = await reverseGeocode(latitude, longitude);
            setUbicacion(address);
          } catch (error) {
            console.error("Error al obtener dirección:", error);
            setUbicacion("Error al obtener dirección - Ingresa manualmente");
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          setUbicacion("Ubicación no disponible - Ingresa manualmente");
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    };

    if (!ubicacion) {
      obtenerUbicacionActual();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Autocompletar fecha actual
  useEffect(() => {
    if (!fechaIncidente) {
      const today = new Date().toISOString().split('T')[0];
      setFechaIncidente(today);
    }
  }, [fechaIncidente]);

  const tiposEvidencia = [
    { value: "imagen", label: "Imagen", icon: Image },
    { value: "video", label: "Video", icon: Video },
    { value: "documento", label: "Documento", icon: FileText },
    { value: "audio", label: "Audio", icon: File },
    { value: "otro", label: "Otro", icon: File }
  ];

  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toLowerCase() || '';
  };

  const agregarEvidencia = () => {
    if (nuevaEvidencia.url.trim()) {
      const extension = getFileExtension(nuevaEvidencia.url);
      const evidencia: Evidencia = {
        url: nuevaEvidencia.url,
        tipo: nuevaEvidencia.tipo,
        nombre: nuevaEvidencia.nombre || `Evidencia ${evidencias.length + 1}`,
        extension
      };
      
      setEvidencias([...evidencias, evidencia]);
      setNuevaEvidencia({ url: "", tipo: "imagen", nombre: "" });
    }
  };

  const eliminarEvidencia = (index: number) => {
    setEvidencias(evidencias.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onNext({
      ubicacion,
      fechaIncidente,
      evidencias
    });
  };

  const getIconForTipo = (tipo: string) => {
    const tipoObj = tiposEvidencia.find(t => t.value === tipo);
    return tipoObj ? tipoObj.icon : File;
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
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <MapPin size={24} className="text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Parámetros de la Denuncia</h2>
        <p className="text-zinc-400">Especifica cuándo y dónde ocurrió el incidente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ubicación */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <MapPin size={16} />
            Ubicación del incidente
          </label>
          <div className="relative">
            <input
              type="text"
              value={isLoadingLocation ? "Obteniendo ubicación..." : ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              disabled={isLoadingLocation}
              className={`w-full p-4 pr-12 rounded-xl bg-zinc-700/50 border border-zinc-600 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                isLoadingLocation ? "cursor-not-allowed opacity-70" : ""
              }`}
              placeholder="Dirección, calle, barrio o punto de referencia"
            />
            <button
              type="button"
              onClick={recargarUbicacion}
              disabled={isLoadingLocation}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                isLoadingLocation 
                  ? "text-zinc-500 cursor-not-allowed" 
                  : "text-zinc-400 hover:text-blue-400 hover:bg-zinc-600/50"
              }`}
              title="Recargar ubicación"
            >
              <RotateCcw size={16} className={isLoadingLocation ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-xs">
              {isLoadingLocation 
                ? "Detectando tu ubicación automáticamente..." 
                : "Se autocompletó con tu ubicación actual. Puedes editarla si es necesario."
              }
            </p>
            {isLoadingLocation && (
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                GPS activo
              </div>
            )}
          </div>
        </motion.div>

        {/* Fecha del incidente */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Calendar size={16} />
            Fecha del incidente *
          </label>
          <input
            type="date"
            value={fechaIncidente}
            onChange={(e) => setFechaIncidente(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-700/50 border border-zinc-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          />
        </motion.div>

        {/* Evidencias */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Upload size={16} />
            Evidencias (opcional)
          </label>
          
          {/* Agregar nueva evidencia */}
          <div className="bg-zinc-700/30 rounded-xl p-4 border border-zinc-600/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <select
                value={nuevaEvidencia.tipo}
                onChange={(e) => setNuevaEvidencia({
                  ...nuevaEvidencia, 
                  tipo: e.target.value as "imagen" | "video" | "documento" | "audio" | "otro"
                })}
                className="p-3 rounded-lg bg-zinc-700/50 border border-zinc-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tiposEvidencia.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                value={nuevaEvidencia.nombre}
                onChange={(e) => setNuevaEvidencia({
                  ...nuevaEvidencia, 
                  nombre: e.target.value
                })}
                className="p-3 rounded-lg bg-zinc-700/50 border border-zinc-600 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del archivo"
              />
              
              <button
                type="button"
                onClick={agregarEvidencia}
                disabled={!nuevaEvidencia.url.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Agregar
              </button>
            </div>
            
            <input
              type="url"
              value={nuevaEvidencia.url}
              onChange={(e) => setNuevaEvidencia({
                ...nuevaEvidencia, 
                url: e.target.value
              })}
              className="w-full p-3 rounded-lg bg-zinc-700/50 border border-zinc-600 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="URL del archivo (imagen, video, documento, etc.)"
            />
          </div>

          {/* Lista de evidencias */}
          {evidencias.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-zinc-300">Evidencias agregadas:</h4>
              {evidencias.map((evidencia, index) => {
                const IconComponent = getIconForTipo(evidencia.tipo);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-zinc-700/30 rounded-lg border border-zinc-600/50"
                  >
                    <IconComponent size={20} className="text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{evidencia.nombre}</p>
                      <p className="text-zinc-400 text-sm truncate">{evidencia.url}</p>
                      <p className="text-zinc-500 text-xs">
                        Tipo: {evidencia.tipo} {evidencia.extension && `• ${evidencia.extension.toUpperCase()}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarEvidencia(index)}
                      className="text-red-400 hover:text-red-300 p-1 transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <motion.button
            type="button"
            onClick={onBack}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
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
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Continuar
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default ParametrosDenunciaForm;

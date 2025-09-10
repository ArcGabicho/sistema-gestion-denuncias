/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Lock, Globe, Camera, RefreshCw, Copy, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

interface StepFormProps {
  formData: any;
  next: (data: any) => void;
  back: () => void;
  isFirst: boolean;
  isLast: boolean;
  isLoading?: boolean;
}

const PreferenciasForm: React.FC<StepFormProps> = ({ formData, next, back, isLoading = false }) => {
  const [privacity, setPrivacity] = useState<'public' | 'private'>(formData.privacity || 'private');
  const [logoUrl, setLogoUrl] = useState(formData.logoUrl || "");
  const [invitationCode, setInvitationCode] = useState(formData.invitationCode || "");
  const [imageError, setImageError] = useState(false);

  // Generar código de invitación automáticamente
  useEffect(() => {
    if (!invitationCode) {
      generateInvitationCode();
    }
  }, [invitationCode]);

  const generateInvitationCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setInvitationCode(result);
  };

  const copyInvitationCode = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      toast.success('Código copiado al portapapeles', {
        duration: 2000,
      });
    } catch {
      toast.error('Error al copiar el código');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    next({
      privacity,
      logoUrl,
      invitationCode,
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const isValidImageUrl = (url: string) => {
    return url && (url.startsWith('http://') || url.startsWith('https://')) && !imageError;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-xl">
          <Settings size={32} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Configuración Final
        </h2>
        <p className="text-zinc-400">
          Personaliza las preferencias de tu comunidad
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        {/* Código de Invitación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Código de Invitación
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              maxLength={8}
              className="flex-1 px-4 py-3 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-mono text-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="ABC12345"
            />
            <button
              type="button"
              onClick={generateInvitationCode}
              disabled={isLoading}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} />
            </button>
            <button
              type="button"
              onClick={copyInvitationCode}
              disabled={isLoading}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy size={20} />
            </button>
          </div>
          <p className="text-zinc-500 text-xs mt-1">
            Los vecinos usarán este código para unirse a tu comunidad
          </p>
          {invitationCode && (
            <div className="mt-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm font-mono text-center">
                Código: <span className="font-bold text-lg">{invitationCode}</span>
              </p>
            </div>
          )}
        </motion.div>

        {/* Privacidad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Configuración de Privacidad
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              type="button"
              onClick={() => setPrivacity('private')}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 border-2 rounded-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                privacity === 'private'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-zinc-600 bg-zinc-700/30 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Lock size={20} className={privacity === 'private' ? 'text-green-400' : 'text-zinc-400'} />
                <span className={`font-semibold ${privacity === 'private' ? 'text-green-300' : 'text-zinc-300'}`}>
                  Privada
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Solo miembros podrán acceder a las denuncias de la comunidad
              </p>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setPrivacity('public')}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 border-2 rounded-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                privacity === 'public'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-zinc-600 bg-zinc-700/30 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Globe size={20} className={privacity === 'public' ? 'text-green-400' : 'text-zinc-400'} />
                <span className={`font-semibold ${privacity === 'public' ? 'text-green-300' : 'text-zinc-300'}`}>
                  Pública
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Se podrá compatir datos de las denuncias de la comunidad
              </p>
            </motion.button>
          </div>
        </motion.div>

        {/* URL de foto de perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            URL de Foto de Perfil (opcional)
          </label>
          <div className="relative">
            <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" size={20} />
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="https://ejemplo.com/mi-imagen.jpg"
            />
          </div>
          <p className="text-zinc-500 text-xs mt-1">
            Ingresa la URL de una imagen para usar como foto de perfil de la comunidad
          </p>
          
          {/* Vista previa de la imagen */}
          {logoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-4"
            >
              {isValidImageUrl(logoUrl) ? (
                <div className="flex justify-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-green-500/30">
                    <img
                        src={logoUrl}
                        alt="Vista previa"
                        className="object-cover w-full h-full"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                    />
                    </div>
                </div>
              ) : (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm text-center">
                    Error al cargar la imagen. Verifica que la URL sea correcta.
                  </p>
                </div>
              )}
            </motion.div>
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
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Creando Comunidad...</span>
              </>
            ) : (
              <>
                <span>Crear Comunidad</span>
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
};

export default PreferenciasForm;
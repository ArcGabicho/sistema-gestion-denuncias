"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Building, Users, ArrowRight, Crown, UserPlus, Shield, MapPin, FileText, ArrowLeft, Home } from "lucide-react";

interface UserFormProps {
  onSelectUserType: (type: 'admin' | 'member') => void;
  onBack?: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onSelectUserType, onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Botón volver al inicio */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Home size={20} />
          <span>Volver al Inicio</span>
        </Link>
      </motion.div>

      {onBack && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          ¿Cómo quieres registrarte?
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Elige el tipo de cuenta que mejor se adapte a tus necesidades
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Opción Administrador - Crear Comunidad */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="group cursor-pointer h-full"
          onClick={() => onSelectUserType('admin')}
        >
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-red-500/20 h-full flex flex-col">
            <div className="text-center flex flex-col h-full">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-xl">
                <Crown size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Administrador de Comunidad
              </h3>
              <div className="flex-grow">
                <p className="text-zinc-300 mb-6 leading-relaxed">
                  Crea y gestiona una nueva comunidad. Perfecto para presidentes de juntas vecinales o administradores de condominios.
                </p>
                <div className="space-y-3 text-sm text-zinc-400 mb-6">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-red-400" />
                    <span>Crear nueva comunidad</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-red-400" />
                    <span>Gestionar miembros</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-red-400" />
                    <span>Permisos completos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-red-400" />
                    <span>Gestionar denuncias</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-red-400 font-semibold group-hover:gap-4 transition-all duration-300 mt-auto">
                <span>Crear Comunidad</span>
                <ArrowRight size={20} className="group-hover:transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Opción Miembro - Unirse a Comunidad */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="group cursor-pointer h-full"
          onClick={() => onSelectUserType('member')}
        >
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-blue-500/20 h-full flex flex-col">
            <div className="text-center flex flex-col h-full">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl">
                <UserPlus size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Miembro de Comunidad
              </h3>
              <div className="flex-grow">
                <p className="text-zinc-300 mb-6 leading-relaxed">
                  Únete a una comunidad existente. Ideal para vecinos que quieren reportar denuncias en su barrio.
                </p>
                <div className="space-y-3 text-sm text-zinc-400 mb-6">
                  <div className="flex items-center gap-3">
                    <UserPlus size={16} className="text-blue-400" />
                    <span>Código de invitación</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-blue-400" />
                    <span>Reportar denuncias</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-blue-400" />
                    <span>Participar en la comunidad</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-400" />
                    <span>Ver estado de reportes</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-400 font-semibold group-hover:gap-4 transition-all duration-300 mt-auto">
                <span>Unirse a Comunidad</span>
                <ArrowRight size={20} className="group-hover:transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="text-center mt-12 text-zinc-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>¿Ya tienes cuenta? <a href="/login" className="text-red-400 hover:text-red-300 transition-colors">Inicia sesión aquí</a></p>
      </motion.div>
    </div>
  );
};

export default UserForm;
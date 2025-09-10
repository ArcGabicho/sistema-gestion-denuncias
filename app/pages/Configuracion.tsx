/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Camera,
  Save,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserProfile {
  avatarUrl: string;
  email: string;
  isActive: boolean;
  lastname: string;
  name: string;
  phone: string;
  role: string;
}

const Configuracion = () => {
  // Estado inicial del usuario (simulado)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    avatarUrl: "",
    email: "juan_bautista543@gmail.com",
    isActive: true,
    lastname: "Bautista Quintalla",
    name: "Juan Teodoro",
    phone: "997737799",
    role: "admin"
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempProfile(prev => ({
          ...prev,
          avatarUrl: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Aquí iría la lógica para guardar en la base de datos
      setUserProfile(tempProfile);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleCancelEdit = () => {
    setTempProfile(userProfile);
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      // Aquí iría la lógica para cambiar la contraseña
      toast.success('Contraseña actualizada correctamente');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordChange(false);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error('Error al cambiar la contraseña');
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      moderator: 'Moderador',
      user: 'Usuario'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-300 border border-red-500/30',
      moderator: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      user: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    };
    return colors[role] || 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30';
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Configuración de Cuenta</h1>
          <p className="text-zinc-400">Administra tu información personal y configuraciones</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil Principal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Información Personal
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center text-sm"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center text-sm"
                    >
                      <Save className="mr-1 h-4 w-4" />
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg transition-colors duration-200 flex items-center text-sm"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden">
                    {tempProfile.avatarUrl ? (
                      <img 
                        src={tempProfile.avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {tempProfile.name.charAt(0)}{tempProfile.lastname.charAt(0)}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 bg-zinc-700 hover:bg-zinc-600 text-white p-1.5 rounded-full border-2 border-zinc-800 transition-colors"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white">
                    {tempProfile.name} {tempProfile.lastname}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(tempProfile.role)}`}>
                      {getRoleLabel(tempProfile.role)}
                    </span>
                    <span className={`flex items-center text-xs ${tempProfile.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${tempProfile.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      {tempProfile.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={tempProfile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={tempProfile.lastname}
                    onChange={(e) => handleInputChange('lastname', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    <Mail className="inline mr-1 h-4 w-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={tempProfile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    <Phone className="inline mr-1 h-4 w-4" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={tempProfile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    <Shield className="inline mr-1 h-4 w-4" />
                    Rol
                  </label>
                  <input
                    type="text"
                    value={getRoleLabel(tempProfile.role)}
                    disabled
                    className="w-full px-3 py-2 bg-zinc-700/30 border border-zinc-600/50 rounded-lg text-zinc-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Los roles solo pueden ser modificados por un super administrador</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estado de la Cuenta
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tempProfile.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4 text-red-600 bg-zinc-700 border-zinc-600 rounded focus:ring-red-500 focus:ring-2 disabled:opacity-50"
                    />
                    <label className="ml-2 text-sm text-zinc-300">
                      Cuenta activa
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Panel de Seguridad */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Cambiar Contraseña */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Seguridad
              </h3>
              
              {!showPasswordChange ? (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Confirmar contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handlePasswordChange}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Actualizar
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswords({ current: '', new: '', confirm: '' });
                      }}
                      className="px-3 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Información de la Cuenta */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Información de la Cuenta
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Estado:</span>
                  <span className={tempProfile.isActive ? 'text-green-400' : 'text-red-400'}>
                    {tempProfile.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Rol:</span>
                  <span className="text-white">{getRoleLabel(tempProfile.role)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Email verificado:</span>
                  <span className="text-green-400 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Sí
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
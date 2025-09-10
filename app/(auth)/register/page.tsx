/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, MapPin, Settings, CheckCircle, Shield, Users, FileText, AlertTriangle, Camera, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import UserForm from "@/app/components/UserForm";
import InvitacionForm from "@/app/components/InvitacionForm";
import UserAccess from "@/app/components/UserAccess";
import DatosAccesoForm from "@/app/components/DatosAccesoForm";
import DatosComunidadForm from "@/app/components/DatosComunidadForm";
import PreferenciasForm from "@/app/components/PreferenciasForm";

// Importar servicios de autenticación
import { registerAdmin, registerMember, validateInvitationCode } from "@/app/services/authService";

type UserType = 'admin' | 'member' | null;
type MemberStep = 'invitation' | 'registration';

const adminSteps = [
  { label: "Datos de acceso", component: DatosAccesoForm, icon: Mail },
  { label: "Datos de la comunidad", component: DatosComunidadForm, icon: MapPin },
  { label: "Preferencias iniciales", component: PreferenciasForm, icon: Settings },
];

const Register = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [memberStep, setMemberStep] = useState<MemberStep>('invitation');
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [validatedInvitationCode, setValidatedInvitationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Función para seleccionar tipo de usuario
  const handleSelectUserType = (type: 'admin' | 'member') => {
    setUserType(type);
    setStep(0);
    setMemberStep('invitation');
    setFormData({});
    setValidatedInvitationCode("");
    
    toast.success(`Iniciando registro como ${type === 'admin' ? 'Administrador' : 'Miembro'}`, {
      duration: 1500,
    });
  };

  // Función para volver a la selección inicial
  const handleBack = () => {
    if (userType === 'admin' && step === 0) {
      setUserType(null);
      setStep(0);
      setFormData({});
    } else if (userType === 'member' && memberStep === 'invitation') {
      setUserType(null);
      setMemberStep('invitation');
      setValidatedInvitationCode("");
    } else if (userType === 'member' && memberStep === 'registration') {
      setMemberStep('invitation');
      setValidatedInvitationCode("");
    } else {
      setStep((prev) => Math.max(prev - 1, 0));
      toast('Paso anterior', {
        icon: '↩️',
        duration: 800,
      });
    }
  };

  // Función para manejar el código de invitación validado
  const handleInvitationValidated = async (invitationCode: string) => {
    setIsLoading(true);
    
    try {
      const comunidad = await validateInvitationCode(invitationCode);
      
      if (comunidad) {
        setValidatedInvitationCode(invitationCode);
        setMemberStep('registration');
        toast.success('Código validado correctamente', {
          duration: 1500,
        });
      } else {
        toast.error('Código de invitación inválido');
      }
    } catch (error) {
      console.error('Error validating invitation code:', error);
      toast.error('Error al validar el código');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para avanzar al siguiente paso (solo para admin)
  const next = async (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
  
    if (step < adminSteps.length - 1) {
      toast.success(`Paso ${step + 1} completado`, {
        duration: 1200,
      });
      setStep((prev) => Math.min(prev + 1, adminSteps.length - 1));
    } else {
      // Último paso - registrar administrador y crear comunidad
      setIsLoading(true);
      
      try {
        const finalData = { ...formData, ...data };
        
        const result = await registerAdmin(
          {
            email: finalData.email,
            password: finalData.password,
            name: finalData.name || '',
            lastname: finalData.lastname || '',
            phone: finalData.phone,
          },
          {
            nombre: finalData.nombre,
            descripcion: finalData.descripcion,
            direccion: finalData.direccion,
          },
          {
            privacity: finalData.privacity,
            logoUrl: finalData.logoUrl,
            invitationCode: finalData.invitationCode,
          }
        );

        if (result.success) {
          toast.success(`¡Bienvenido ${result.user.name}! Registro completado exitosamente`, {
            duration: 2500,
            icon: '🎉',
          });
          
          // Auto-login y redirección después de 2 segundos
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
        
      } catch (error: any) {
        console.error('Registration error:', error);
        toast.error(error.message || 'Error al completar el registro');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Función para completar registro de miembro
  const handleMemberComplete = async (data: any) => {
    setIsLoading(true);
    
    try {
      const result = await registerMember({
        email: data.email,
        password: data.password,
        name: data.name,
        lastname: data.lastname,
        phone: data.phone,
        invitationCode: validatedInvitationCode,
      });

      if (result.success) {
        toast.success(`¡Bienvenido ${result.user.name}! Te has unido a la comunidad`, {
          duration: 2500,
          icon: '🎉',
        });
        
        // Auto-login y redirección después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Member registration error:', error);
      toast.error(error.message || 'Error al completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  // Si no se ha seleccionado tipo de usuario, mostrar UserForm
  if (!userType) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
        <UserForm onSelectUserType={handleSelectUserType} />
      </main>
    );
  }

  // Si se seleccionó miembro, mostrar flujo de invitación o registro
  if (userType === 'member') {
    if (memberStep === 'invitation') {
      return (
        <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
          <InvitacionForm 
            onBack={handleBack}
            onNext={handleInvitationValidated}
            isLoading={isLoading}
          />
        </main>
      );
    } else {
      return (
        <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
          <UserAccess 
            onBack={handleBack}
            onComplete={handleMemberComplete}
            invitationCode={validatedInvitationCode}
            isLoading={isLoading}
          />
        </main>
      );
    }
  }

  // Si se seleccionó admin, mostrar el wizard de creación de comunidad
  const StepComponent = adminSteps[step].component;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-8 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full mx-auto mb-4"
            />
            <h3 className="text-white font-semibold mb-2">Creando tu cuenta...</h3>
            <p className="text-zinc-400 text-sm">Por favor espera mientras procesamos tu registro</p>
          </motion.div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-zinc-700 z-40">
        <motion.div
          className="h-full bg-gradient-to-r from-red-500 to-red-600"
          initial={{ width: "0%" }}
          animate={{ width: `${((step + 1) / adminSteps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-7xl">
        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex justify-between w-full max-w-md">
            {adminSteps.map((s, i) => {
              const IconComponent = s.icon;
              const isCompleted = i < step;
              const isCurrent = i === step;
              
              return (
                <motion.div
                  key={s.label}
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: isCurrent ? 1 : isCompleted ? 0.8 : 0.5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isCurrent 
                      ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30' 
                      : isCompleted 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'bg-zinc-700 border-zinc-600 text-zinc-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : isLoading && isCurrent ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <IconComponent size={20} />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-300 text-center ${
                    isCurrent ? 'text-red-400' : isCompleted ? 'text-green-400' : 'text-zinc-500'
                  }`}>
                    {s.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Main Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Image Section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`image-${step}`}
              initial={{ x: step % 2 === 0 ? -100 : 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: step % 2 === 0 ? -100 : 100, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className={`relative ${step % 2 === 1 ? 'lg:order-2' : 'lg:order-1'} self-stretch`}
            >
              <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                {step === 0 && (
                  <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/30 rounded-2xl relative overflow-hidden min-h-full">
                    <div className="absolute inset-0 opacity-10">
                      <Shield className="absolute top-8 left-8 w-12 h-12 text-white" />
                      <FileText className="absolute top-8 right-8 w-10 h-10 text-white" />
                      <Users className="absolute bottom-8 left-8 w-14 h-14 text-white" />
                      <AlertTriangle className="absolute bottom-8 right-8 w-8 h-8 text-white" />
                    </div>
                    
                    <div className="text-center p-8 relative z-10 h-full flex flex-col justify-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-xl relative"
                      >
                        <Mail size={64} className="text-white" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Shield size={14} className="text-white" />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-4">Acceso Seguro</h3>
                      <p className="text-zinc-300 leading-relaxed mb-4">
                        Crea tu cuenta de administrador para gestionar las denuncias de tu comunidad de forma segura y confidencial.
                      </p>
                      <div className="flex justify-center space-x-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Shield size={12} />
                          <span>Seguro</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText size={12} />
                          <span>Confidencial</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {step === 1 && (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 rounded-2xl relative overflow-hidden min-h-full">
                    <div className="absolute inset-0 opacity-10">
                      <Users className="absolute top-6 left-6 w-16 h-16 text-white" />
                      <MapPin className="absolute top-6 right-6 w-12 h-12 text-white" />
                      <FileText className="absolute bottom-6 left-6 w-10 h-10 text-white" />
                      <Camera className="absolute bottom-6 right-6 w-14 h-14 text-white" />
                    </div>
                    
                    <div className="text-center p-8 relative z-10 h-full flex flex-col justify-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl relative"
                      >
                        <MapPin size={64} className="text-white" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Users size={14} className="text-white" />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-4">Tu Comunidad</h3>
                      <p className="text-zinc-300 leading-relaxed mb-4">
                        Registra los datos de tu comunidad residencial para crear un espacio seguro donde los vecinos puedan reportar incidentes.
                      </p>
                      <div className="flex justify-center space-x-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>Vecinos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Camera size={12} />
                          <span>Evidencias</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {step === 2 && (
                  <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 rounded-2xl relative overflow-hidden min-h-full">
                    <div className="absolute inset-0 opacity-10">
                      <Settings className="absolute top-8 left-8 w-14 h-14 text-white" />
                      <Clock className="absolute top-8 right-8 w-12 h-12 text-white" />
                      <AlertTriangle className="absolute bottom-8 left-8 w-10 h-10 text-white" />
                      <CheckCircle className="absolute bottom-8 right-8 w-16 h-16 text-white" />
                    </div>
                    
                    <div className="text-center p-8 relative z-10 h-full flex flex-col justify-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-xl relative"
                      >
                        <Settings size={64} className="text-white" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-4">Configuración Final</h3>
                      <p className="text-zinc-300 leading-relaxed mb-4">
                        Establece las preferencias de privacidad y personaliza el acceso a tu plataforma de gestión de denuncias.
                      </p>
                      <div className="flex justify-center space-x-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>Seguimiento</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} />
                          <span>Alertas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Animated decorative elements */}
                <motion.div 
                  className="absolute top-4 right-4 w-16 h-16 bg-white/5 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/20 rounded-full"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Form Container */}
          <motion.div
            className={`${step % 2 === 1 ? 'lg:order-1' : 'lg:order-2'} self-stretch flex flex-col`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-zinc-700/50 p-8 h-full flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ x: step % 2 === 0 ? 300 : -300, opacity: 0, scale: 0.9 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: step % 2 === 0 ? -300 : 300, opacity: 0, scale: 0.9 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeInOut",
                    type: "spring",
                    stiffness: 100
                  }}
                  className="flex-shrink-0"
                >
                  <StepComponent
                    formData={formData}
                    next={next}
                    back={handleBack}
                    isFirst={step === 0}
                    isLast={step === adminSteps.length - 1}
                    isLoading={isLoading}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div 
          className="text-center mt-8 text-zinc-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Paso {step + 1} de {adminSteps.length} - Administrador</span>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-zinc-500">Sistema de Gestión de Denuncias Comunitarias</p>
        </motion.div>
      </div>
    </main>
  );
};

export default Register;

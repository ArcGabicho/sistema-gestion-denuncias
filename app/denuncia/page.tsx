"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowLeft, Home } from "lucide-react";
import toast from "react-hot-toast";
import DatosDenunciaForm from "@/app/components/DatosDenunciaForm";
import ParametrosDenunciaForm from "@/app/components/ParametrosDenunciaForm";
import DatosDenunciante from "@/app/components/DatosDenunciante";
import { DenunciaPublica, Denunciante } from "@/app/interfaces/DenunciaPublica";
import { crearDenunciaPublica } from "@/app/services/denunciaService";

export default function DenunciaPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<DenunciaPublica>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { number: 1, title: "Datos de la Denuncia", description: "Describe el problema" },
    { number: 2, title: "Parámetros", description: "Ubicación y evidencias" },
    { number: 3, title: "Tus Datos", description: "Información de contacto" }
  ];

  const handleNext = (stepData: Partial<DenunciaPublica>) => {
    setFormData({ ...formData, ...stepData });
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (denuncianteData: { denunciante: Denunciante }) => {
    setIsSubmitting(true);
    
    try {
      const completeDenuncia: Omit<DenunciaPublica, 'id' | 'fechaCreacion'> = {
        titulo: formData.titulo || "",
        descripcion: formData.descripcion || "",
        categoria: formData.categoria || "otro",
        ubicacion: formData.ubicacion || "",
        fechaIncidente: formData.fechaIncidente || new Date().toISOString().split('T')[0],
        evidencias: formData.evidencias || [],
        denunciante: denuncianteData.denunciante,
        estado: "pendiente"
      };

      // Guardar denuncia en Firebase
      const denunciaId = await crearDenunciaPublica(completeDenuncia);
      
      console.log("Denuncia guardada en Firebase con ID:", denunciaId);
      
      setSubmitted(true);
      toast.success(
        denuncianteData.denunciante.anonimo 
          ? "Denuncia anónima enviada exitosamente" 
          : "Denuncia enviada exitosamente. Te contactaremos pronto.",
        {
          duration: 5000,
          icon: "✅"
        }
      );
      
    } catch (error) {
      console.error("Error enviando denuncia:", error);
      toast.error(
        "Error al enviar la denuncia. Verifica tu conexión e intenta nuevamente.",
        {
          duration: 5000,
          icon: "❌"
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({});
    setSubmitted(false);
  };

  const goToHome = () => {
    window.location.href = "/";
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700/50 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={32} className="text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-4">¡Denuncia Enviada!</h2>
          <p className="text-zinc-400 mb-6">
            Tu denuncia ha sido recibida correctamente. Nuestro equipo la revisará y tomará las acciones correspondientes.
          </p>
          
          <div className="space-y-3">
            <motion.button
              onClick={resetForm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Hacer otra denuncia
            </motion.button>
            
            <motion.button
              onClick={goToHome}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Volver al Inicio
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft size={20} />
            Volver
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Realizar Denuncia</h1>
            <p className="text-zinc-400">Reporta problemas en tu comunidad</p>
          </motion.div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Indicador de pasos */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all duration-300 ${
                    currentStep === step.number
                      ? "bg-blue-600 text-white shadow-lg scale-110"
                      : currentStep > step.number
                      ? "bg-green-600 text-white"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle size={20} />
                  ) : (
                    step.number
                  )}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="ml-3 text-left hidden md:block"
                >
                  <p className="text-white font-medium">{step.title}</p>
                  <p className="text-zinc-400 text-sm">{step.description}</p>
                </motion.div>
                
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-zinc-700 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Formularios */}
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <DatosDenunciaForm
                key="step1"
                formData={formData}
                onNext={handleNext}
              />
            )}
            
            {currentStep === 2 && (
              <ParametrosDenunciaForm
                key="step2"
                formData={formData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentStep === 3 && (
              <DatosDenunciante
                key="step3"
                formData={formData}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Loading overlay */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-zinc-800 rounded-2xl p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white font-medium">Enviando denuncia...</p>
              <p className="text-zinc-400 text-sm">Por favor espera un momento</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
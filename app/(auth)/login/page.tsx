
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Shield, Users, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/app/services/authService";

const Login = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);

        try {
            const result = await loginUser(formData.email, formData.password);
            
            if (result.success) {
                toast.success(`¡Bienvenido ${result.user.name}!`);
                
                // Redirigir según el rol del usuario
                if (result.user.role === 'admin') {
                    router.push('/dashboard');
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
                {/* Contenedor principal centrado */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-1 lg:grid-cols-2 bg-zinc-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-zinc-700/50 overflow-hidden"
                >
                    {/* Formulario de Login - Izquierda */}
                    <div className="p-8 lg:p-12 flex flex-col justify-center relative">
                        {/* Link de volver al inicio en la esquina superior izquierda */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="absolute top-6 left-6"
                        >
                            <Link 
                                href="/"
                                className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors duration-200 text-sm"
                            >
                                <ArrowLeft size={16} />
                                <span>Volver</span>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center mb-8"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <LogIn size={24} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h1>
                            <p className="text-zinc-400">Accede a tu plataforma de gestión comunitaria</p>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campo Email */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <Mail size={16} />
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-4 rounded-xl bg-zinc-700/50 border border-zinc-600 text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    placeholder="tu@email.com"
                                    disabled={isLoading}
                                    required
                                />
                            </motion.div>

                            {/* Campo Password */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <Lock size={16} />
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full p-4 rounded-xl bg-zinc-700/50 border border-zinc-600 text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 pr-12"
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Botón de Login */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                        <span>Iniciando sesión...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Iniciar Sesión</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Link de registro */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center mt-6 pt-6 border-t border-zinc-700"
                        >
                            <p className="text-zinc-400">
                                ¿No tienes una cuenta?{" "}
                                <Link 
                                    href="/register" 
                                    className="text-red-400 hover:text-red-300 font-medium transition-colors"
                                >
                                    Registrarse aquí
                                </Link>
                            </p>
                        </motion.div>
                    </div>

                    {/* Imagen/Información - Derecha */}
                    <div className="relative bg-gradient-to-br from-red-500/20 to-red-700/20 border-l border-red-500/30 flex items-center justify-center p-8 lg:p-12">
                        {/* Elementos decorativos de fondo */}
                        <div className="absolute inset-0 opacity-10">
                            <Shield className="absolute top-8 left-8 w-16 h-16 text-white" />
                            <Users className="absolute top-8 right-8 w-12 h-12 text-white" />
                            <AlertTriangle className="absolute bottom-8 left-8 w-10 h-10 text-white" />
                            <LogIn className="absolute bottom-8 right-8 w-14 h-14 text-white" />
                        </div>

                        <div className="text-center relative z-10">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-xl relative"
                            >
                                <Shield size={64} className="text-white" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <Users size={14} className="text-white" />
                                </div>
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-3xl font-bold text-white mb-4"
                            >
                                Gestión Comunitaria
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-zinc-300 leading-relaxed mb-6"
                            >
                                Plataforma segura para la gestión de denuncias y comunicación entre vecinos. 
                                Mantén tu comunidad informada y protegida.
                            </motion.p>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="flex justify-center space-x-6 text-sm text-zinc-400"
                            >
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-green-400" />
                                    <span>Seguro</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-blue-400" />
                                    <span>Comunitario</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-yellow-400" />
                                    <span>Eficaz</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Elementos animados decorativos */}
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

                {/* Footer Info */}
                <motion.div 
                    className="text-center mt-8 text-zinc-400 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <p className="text-zinc-500">Sistema de Gestión de Denuncias Comunitarias</p>
                </motion.div>
            </div>
        </main>
    )
}

export default Login;
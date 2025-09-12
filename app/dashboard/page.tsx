/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { useRouter } from "next/navigation";

import Sidebar from "@/app/components/Sidebar";
import Inicio from "../pages/Inicio";
import Denuncias from "../pages/Denuncias";
import Datos from "../pages/Datos";
import Reportes from "../pages/Reportes";
import IA from "../pages/IA";
import Miembros from "../pages/Miembros";
import Configuracion from "../pages/Configuracion";

const Dashboard = () => {
    const router = useRouter();
    const [vistaActual, setVistaActual] = useState("Inicio");
    const [user, setUser] = useState<any>(null);
    const [comunidad, setComunidad] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                // Si había un usuario antes y ahora no (sign out)
                if (user && !loading) {
                    setSigningOut(true);
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                } else if (!user && !loading) {
                    // No hay usuario y no se está cargando (acceso directo sin auth)
                    router.push('/');
                }
                setLoading(false);
                setUser(null);
                setComunidad(null);
                return;
            }
            // Obtener datos del usuario
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (!userDoc.exists()) {
                setLoading(false);
                setUser(null);
                setComunidad(null);
                return;
            }
            const userData = userDoc.data();
            setUser(userData);

            // Obtener datos de la comunidad (tenant)
            if (userData.comunidadId) {
                const comunidadDoc = await getDoc(doc(db, "comunidades", userData.comunidadId));
                if (comunidadDoc.exists()) {
                    setComunidad(comunidadDoc.data());
                } else {
                    setComunidad(null);
                }
            } else {
                setComunidad(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [loading, router, user]);

    if (signingOut) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                <div className="text-center space-y-6 p-8">
                    <div className="animate-pulse">
                        <div className="w-16 h-16 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">✓</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">¡Hasta pronto!</h2>
                        <p className="text-zinc-400">Cerrando sesión de forma segura...</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                    <span className="text-zinc-400">Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    if (!user || !comunidad) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                <div className="text-center space-y-4">
                    <span className="text-red-400">No se pudo cargar la información de usuario o comunidad.</span>
                    <button 
                        onClick={() => router.push('/')}
                        className="block mx-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    const renderVista = () => {
        switch (vistaActual) {
        case "Inicio":
            return <Inicio />;
        case "Miembros":
            return <Miembros />;
        case "Denuncias":
            return <Denuncias />;
        case "Datos":
            return <Datos />;
        case "Reportes":
            return <Reportes />;
        case "IA":
            return <IA />;
        case "Configuracion":
            return <Configuracion />;
        default:
            return <Inicio />;
        }
    };

    return (
        <main className="min-h-screen p-8">
            <Sidebar 
                onChangeVista={({ href }) => setVistaActual(href)} 
                onSignOut={() => setSigningOut(true)}
            />
            <div className="ml-64 flex-1 overflow-auto">
                {renderVista()}
            </div>
        </main>
    );
};

export default Dashboard;
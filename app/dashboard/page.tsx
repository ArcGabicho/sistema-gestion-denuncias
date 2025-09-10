/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/utils/firebase";

import Sidebar from "@/app/components/Sidebar";
import Inicio from "../pages/Inicio";
import Denuncias from "../pages/Denuncias";
import Datos from "../pages/Datos";
import Reportes from "../pages/Reportes";
import IA from "../pages/IA";
import Miembros from "../pages/Miembros";
import Configuracion from "../pages/Configuracion";

const Dashboard = () => {
    const [vistaActual, setVistaActual] = useState("Inicio");
    const [user, setUser] = useState<any>(null);
    const [comunidad, setComunidad] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
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
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="text-zinc-400">Cargando dashboard...</span>
            </div>
        );
    }

    if (!user || !comunidad) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="text-red-400">No se pudo cargar la información de usuario o comunidad.</span>
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
            <Sidebar onChangeVista={({ href }) => setVistaActual(href)} />
            <div className="ml-64 flex-1 overflow-auto">
                {renderVista()}
            </div>
        </main>
    );
};

export default Dashboard;
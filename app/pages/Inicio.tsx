/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { User } from "@/app/interfaces/User";
import { Comunidad } from "@/app/interfaces/Comunidad";
import { Timestamp } from "firebase/firestore";
import { 
    Bell, 
    FileText, 
    Users, 
    CheckCircle, 
    Clock
} from "lucide-react";

interface DenunciaReciente {
    id: string;
    titulo: string;
    descripcion: string;
    estado: "pendiente" | "en_revision" | "resuelta";
    createdAt: Timestamp;
    comunidadId: string;
}

interface DashboardStats {
    totalDenuncias: number;
    denunciasPendientes: number;
    denunciasResueltas: number;
    totalMiembros: number;
    denunciasRecientes: DenunciaReciente[];
}

const Inicio = () => {
    const [user, setUser] = useState<User | null>(null);
    const [comunidad, setComunidad] = useState<Comunidad | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalDenuncias: 0,
        denunciasPendientes: 0,
        denunciasResueltas: 0,
        totalMiembros: 0,
        denunciasRecientes: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            // Obtener datos del usuario
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setUser(userData);

                // Obtener datos de la comunidad
                if (userData.comunidadId) {
                    const comunidadDoc = await getDoc(doc(db, "comunidades", userData.comunidadId));
                    if (comunidadDoc.exists()) {
                        const comunidadData = { id: comunidadDoc.id, ...comunidadDoc.data() } as Comunidad;
                        setComunidad(comunidadData);
                        await loadDashboardStats(userData.comunidadId);
                    }
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadDashboardStats = async (comunidadId: string) => {
        try {
            // Obtener total de denuncias internas de la comunidad
            const denunciasQuery = query(
                collection(db, "denuncias_internas"),
                where("comunidadId", "==", comunidadId)
            );
            const denunciasSnapshot = await getDocs(denunciasQuery);
            const totalDenuncias = denunciasSnapshot.size;

            // Contar denuncias por estado
            let pendientes = 0;
            let resueltas = 0;

            denunciasSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.estado === "pendiente") {
                    pendientes++;
                } else if (data.estado === "resuelta") {
                    resueltas++;
                }
            });

            // Obtener denuncias del día actual
            const hoy = new Date();
            const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

            const recientesQuery = query(
                collection(db, "denuncias_internas"),
                where("comunidadId", "==", comunidadId),
                where("fechaCreacion", ">=", Timestamp.fromDate(inicioDia)),
                where("fechaCreacion", "<", Timestamp.fromDate(finDia)),
                orderBy("fechaCreacion", "desc")
            );
            
            try {
                const recientesSnapshot = await getDocs(recientesQuery);
                const denunciasRecientes: DenunciaReciente[] = recientesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    titulo: doc.data().titulo || "Sin título",
                    descripcion: doc.data().descripcion || "Sin descripción",
                    estado: doc.data().estado || "pendiente",
                    createdAt: doc.data().fechaCreacion,
                    comunidadId: doc.data().comunidadId
                }));

                // Obtener total de miembros de la comunidad
                const miembrosQuery = query(
                    collection(db, "users"),
                    where("comunidadId", "==", comunidadId)
                );
                const miembrosSnapshot = await getDocs(miembrosQuery);
                const totalMiembros = miembrosSnapshot.size;

                setStats({
                    totalDenuncias,
                    denunciasPendientes: pendientes,
                    denunciasResueltas: resueltas,
                    totalMiembros,
                    denunciasRecientes
                });
            } catch {
                console.log("Índice compuesto no disponible, mostrando denuncias sin filtro de fecha");
                // Si no hay índice, obtener las últimas 5 denuncias sin filtro de fecha
                const fallbackQuery = query(
                    collection(db, "denuncias_internas"),
                    where("comunidadId", "==", comunidadId),
                    orderBy("fechaCreacion", "desc"),
                    limit(5)
                );
                const fallbackSnapshot = await getDocs(fallbackQuery);
                const denunciasRecientes: DenunciaReciente[] = fallbackSnapshot.docs.map(doc => ({
                    id: doc.id,
                    titulo: doc.data().titulo || "Sin título",
                    descripcion: doc.data().descripcion || "Sin descripción",
                    estado: doc.data().estado || "pendiente",
                    createdAt: doc.data().fechaCreacion,
                    comunidadId: doc.data().comunidadId
                }));

                // Obtener total de miembros de la comunidad
                const miembrosQuery = query(
                    collection(db, "users"),
                    where("comunidadId", "==", comunidadId)
                );
                const miembrosSnapshot = await getDocs(miembrosQuery);
                const totalMiembros = miembrosSnapshot.size;

                setStats({
                    totalDenuncias,
                    denunciasPendientes: pendientes,
                    denunciasResueltas: resueltas,
                    totalMiembros,
                    denunciasRecientes
                });
            }

        } catch (error) {
            console.error("Error cargando estadísticas:", error);
        }
    };

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return "Fecha no disponible";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case "pendiente":
                return "text-yellow-300 bg-yellow-500/20 border border-yellow-500/30";
            case "en_revision":
                return "text-blue-300 bg-blue-500/20 border border-blue-500/30";
            case "resuelta":
                return "text-green-300 bg-green-500/20 border border-green-500/30";
            default:
                return "text-zinc-300 bg-zinc-500/20 border border-zinc-500/30";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-zinc-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 h-full bg-zinc-900 rounded-xl">
            {/* Header principal con información de la comunidad */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-6 text-white border border-red-700/50 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    {/* Información principal */}
                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-3xl lg:text-4xl font-bold mb-3 tracking-wide">
                            Bienvenido, {user?.name || "Usuario"}
                        </h1>
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                            {comunidad?.logoUrl && (
                                <div className="relative">
                                    <img
                                        src={comunidad.logoUrl} 
                                        alt="Logo de la comunidad" 
                                        width={60}
                                        height={60}
                                        className="w-15 h-15 rounded-full border-2 border-white shadow-xl object-cover object-center"
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            objectPosition: 'center'
                                        }}
                                    />
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {comunidad?.nombre || "Comunidad"}
                                </h2>
                                <p className="text-red-100 text-sm">
                                    {comunidad?.descripcion || "Sistema de Gestión de Denuncias"}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Código de invitación prominente */}
                    <div className="text-center">
                        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
                            <p className="text-red-100 text-xs font-medium mb-1">Código de Invitación</p>
                            <p className="text-2xl font-bold tracking-widest text-white">
                                {comunidad?.invitationCode || "BWE65WGH"}
                            </p>
                            <p className="text-red-100 text-xs mt-1">
                                Comparte para invitar miembros
                            </p>
                        </div>
                    </div>
                </div>
            </div>



            {/* Contenido principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Estadísticas detalladas - Izquierda */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-red-500 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-white mb-1">{stats.totalDenuncias}</p>
                                <p className="text-zinc-300 text-sm font-medium">Total Denuncias</p>
                            </div>
                            <div className="bg-red-600/20 p-3 rounded-full border border-red-500/30">
                                <FileText className="h-6 w-6 text-red-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-yellow-500 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-white mb-1">{stats.denunciasPendientes}</p>
                                <p className="text-zinc-300 text-sm font-medium">Pendientes</p>
                            </div>
                            <div className="bg-yellow-500/20 p-3 rounded-full border border-yellow-500/30">
                                <Clock className="h-6 w-6 text-yellow-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-white mb-1">{stats.denunciasResueltas}</p>
                                <p className="text-zinc-300 text-sm font-medium">Resueltas</p>
                            </div>
                            <div className="bg-green-500/20 p-3 rounded-full border border-green-500/30">
                                <CheckCircle className="h-6 w-6 text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-white mb-1">{stats.totalMiembros}</p>
                                <p className="text-zinc-300 text-sm font-medium">Miembros</p>
                            </div>
                            <div className="bg-blue-500/20 p-3 rounded-full border border-blue-500/30">
                                <Users className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Denuncias recientes - Derecha */}
                <div className="lg:col-span-2">
                    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-zinc-700/50 h-full">
                        <div className="p-4 border-b border-zinc-700/50">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <Bell className="h-5 w-5 text-red-400 mr-2" />
                                Denuncias de Hoy
                            </h3>
                            <p className="text-zinc-400 text-sm mt-1">
                                Denuncias internas reportadas el {new Date().toLocaleDateString('es-ES', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                        <div className="p-4">
                            {stats.denunciasRecientes.length > 0 ? (
                                <div className="space-y-3 overflow-y-auto max-h-[285px] pr-2 scrollbar-thin scrollbar-track-zinc-800/50 scrollbar-thumb-zinc-600/50 scrollbar-thumb-rounded-full hover:scrollbar-thumb-zinc-500/70">
                                    {stats.denunciasRecientes.map((denuncia) => (
                                        <div key={denuncia.id} className="flex items-start space-x-3 p-3 bg-zinc-700/30 rounded-lg border border-zinc-600/50 hover:border-red-500/50 transition-colors">
                                            <div className="flex-shrink-0">
                                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${getEstadoColor(denuncia.estado)}`}>
                                                    {denuncia.estado?.replace("_", " ").toUpperCase() || "PENDIENTE"}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white line-clamp-1">
                                                    {denuncia.titulo || "Sin título"}
                                                </p>
                                                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                                                    {denuncia.descripcion || "Sin descripción"}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    {formatDate(denuncia.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="h-16 w-16 text-zinc-500 mx-auto mb-4" />
                                    <p className="text-zinc-300 text-lg">No hay denuncias hoy</p>
                                    <p className="text-zinc-400 text-sm mt-2">No se han reportado denuncias internas en el día de hoy</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Inicio;
"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { User } from "@/app/interfaces/User";
import { Comunidad } from "@/app/interfaces/Comunidad";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    Calendar,
    RefreshCw,
    FileSpreadsheet,
    Database,
    CheckCircle,
    Clock
} from "lucide-react";
import toast from 'react-hot-toast';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

interface DenunciaData {
    id: string;
    titulo: string;
    descripcion: string;
    estado: "pendiente" | "en_revision" | "resuelta";
    tipo?: string;
    createdAt: { toDate?: () => Date; seconds?: number } | undefined;
    comunidadId: string;
    denuncianteId?: string;
}

interface AnalyticsData {
    totalDenuncias: number;
    denunciasPorEstado: { [key: string]: number };
    denunciasPorTipo: { [key: string]: number };
    denunciasPorMes: { [key: string]: number };
    denunciasPorDia: { [key: string]: number };
    promedioResolucion: number;
    tasaResolucion: number;
}

const Datos = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [comunidad, setComunidad] = useState<Comunidad | null>(null);
    const [denuncias, setDenuncias] = useState<DenunciaData[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalDenuncias: 0,
        denunciasPorEstado: {},
        denunciasPorTipo: {},
        denunciasPorMes: {},
        denunciasPorDia: {},
        promedioResolucion: 0,
        tasaResolucion: 0
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("30"); // días
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setCurrentUser(userData);

                if (userData.comunidadId) {
                    const comunidadDoc = await getDoc(doc(db, "comunidades", userData.comunidadId));
                    if (comunidadDoc.exists()) {
                        const comunidadData = { id: comunidadDoc.id, ...comunidadDoc.data() } as Comunidad;
                        setComunidad(comunidadData);
                        await loadAnalyticsData(userData.comunidadId);
                    }
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const loadAnalyticsData = async (comunidadId: string) => {
        try {
            setRefreshing(true);
            
            // Calcular fecha límite basada en el rango seleccionado
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - parseInt(dateRange));

            const denunciasQuery = query(
                collection(db, "denuncias"),
                where("comunidadId", "==", comunidadId)
            );
            
            const denunciasSnapshot = await getDocs(denunciasQuery);
            const denunciasData: DenunciaData[] = denunciasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DenunciaData[];

            // Filtrar por rango de fechas
            const denunciasFiltradas = denunciasData.filter(denuncia => {
                if (!denuncia.createdAt) return false;
                const fechaDenuncia = denuncia.createdAt.toDate ? 
                    denuncia.createdAt.toDate() : 
                    new Date((denuncia.createdAt.seconds || 0) * 1000);
                return fechaDenuncia >= fechaLimite;
            });

            setDenuncias(denunciasFiltradas);
            
            // Calcular analytics
            const analyticsCalculados = calculateAnalytics(denunciasFiltradas);
            setAnalytics(analyticsCalculados);
            
        } catch (error) {
            console.error("Error cargando datos de analytics:", error);
            toast.error("Error al cargar los datos de análisis");
        } finally {
            setRefreshing(false);
        }
    };

    const calculateAnalytics = (denunciasData: DenunciaData[]): AnalyticsData => {
        const totalDenuncias = denunciasData.length;
        
        // Denuncias por estado
        const denunciasPorEstado = denunciasData.reduce((acc, denuncia) => {
            acc[denuncia.estado] = (acc[denuncia.estado] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        // Denuncias por tipo
        const denunciasPorTipo = denunciasData.reduce((acc, denuncia) => {
            const tipo = denuncia.tipo || 'Sin categoría';
            acc[tipo] = (acc[tipo] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        // Denuncias por mes
        const denunciasPorMes = denunciasData.reduce((acc, denuncia) => {
            if (denuncia.createdAt) {
                const fecha = denuncia.createdAt.toDate ? 
                    denuncia.createdAt.toDate() : 
                    new Date((denuncia.createdAt.seconds || 0) * 1000);
                const mes = fecha.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
                acc[mes] = (acc[mes] || 0) + 1;
            }
            return acc;
        }, {} as { [key: string]: number });

        // Denuncias por día de la semana
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const denunciasPorDia = denunciasData.reduce((acc, denuncia) => {
            if (denuncia.createdAt) {
                const fecha = denuncia.createdAt.toDate ? 
                    denuncia.createdAt.toDate() : 
                    new Date((denuncia.createdAt.seconds || 0) * 1000);
                const dia = diasSemana[fecha.getDay()];
                acc[dia] = (acc[dia] || 0) + 1;
            }
            return acc;
        }, {} as { [key: string]: number });

        // Tasa de resolución
        const resueltas = denunciasPorEstado['resuelta'] || 0;
        const tasaResolucion = totalDenuncias > 0 ? (resueltas / totalDenuncias) * 100 : 0;

        return {
            totalDenuncias,
            denunciasPorEstado,
            denunciasPorTipo,
            denunciasPorMes,
            denunciasPorDia,
            promedioResolucion: 0, // Calcular después con más datos
            tasaResolucion
        };
    };

    const exportToExcel = () => {
        try {
            // Crear CSV como alternativa a Excel
            const headers = ['ID', 'Título', 'Descripción', 'Estado', 'Tipo', 'Fecha de Creación'];
            const csvData = denuncias.map(denuncia => [
                denuncia.id,
                `"${denuncia.titulo.replace(/"/g, '""')}"`,
                `"${denuncia.descripcion.replace(/"/g, '""')}"`,
                denuncia.estado,
                denuncia.tipo || 'Sin categoría',
                denuncia.createdAt ? 
                    (denuncia.createdAt.toDate ? 
                        denuncia.createdAt.toDate() : 
                        new Date((denuncia.createdAt.seconds || 0) * 1000)
                    ).toLocaleDateString("es-ES") 
                    : 'No disponible'
            ]);

            // Agregar estadísticas al final
            csvData.push([]);
            csvData.push(['ESTADÍSTICAS']);
            csvData.push(['Total de Denuncias', analytics.totalDenuncias.toString()]);
            csvData.push(['Tasa de Resolución', `${analytics.tasaResolucion.toFixed(1)}%`]);
            csvData.push(['Pendientes', (analytics.denunciasPorEstado['pendiente'] || 0).toString()]);
            csvData.push(['En Revisión', (analytics.denunciasPorEstado['en_revision'] || 0).toString()]);
            csvData.push(['Resueltas', (analytics.denunciasPorEstado['resuelta'] || 0).toString()]);

            // Crear contenido CSV
            const csvContent = [headers, ...csvData]
                .map(row => row.join(','))
                .join('\n');

            // Descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `analisis-denuncias-${new Date().toLocaleDateString("es-ES").replace(/\//g, "-")}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Archivo CSV exportado correctamente");
        } catch (error) {
            console.error("Error exportando:", error);
            toast.error("Error al exportar el archivo");
        }
    };

    // Configuración de gráficos
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#e4e4e7', // zinc-200
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(39, 39, 42, 0.9)', // zinc-800
                titleColor: '#ffffff',
                bodyColor: '#e4e4e7',
                borderColor: '#71717a', // zinc-500
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#a1a1aa' // zinc-400
                },
                grid: {
                    color: 'rgba(113, 113, 122, 0.2)' // zinc-500 with opacity
                }
            },
            y: {
                ticks: {
                    color: '#a1a1aa' // zinc-400
                },
                grid: {
                    color: 'rgba(113, 113, 122, 0.2)' // zinc-500 with opacity
                }
            }
        }
    };

    const estadosChartData = {
        labels: Object.keys(analytics.denunciasPorEstado).map(estado => {
            switch(estado) {
                case 'pendiente': return 'Pendientes';
                case 'en_revision': return 'En Revisión';
                case 'resuelta': return 'Resueltas';
                default: return estado;
            }
        }),
        datasets: [
            {
                data: Object.values(analytics.denunciasPorEstado),
                backgroundColor: [
                    'rgba(251, 191, 36, 0.8)', // Yellow for pendientes
                    'rgba(96, 165, 250, 0.8)', // Blue for en revisión
                    'rgba(52, 211, 153, 0.8)', // Green for resueltas
                ],
                borderColor: [
                    'rgb(251, 191, 36)',
                    'rgb(96, 165, 250)',
                    'rgb(52, 211, 153)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const tiposChartData = {
        labels: Object.keys(analytics.denunciasPorTipo),
        datasets: [
            {
                label: 'Cantidad de Denuncias',
                data: Object.values(analytics.denunciasPorTipo),
                backgroundColor: 'rgba(248, 113, 113, 0.8)', // red-400 with opacity
                borderColor: 'rgb(248, 113, 113)', // red-400
                borderWidth: 2,
            },
        ],
    };

    const tendenciaChartData = {
        labels: Object.keys(analytics.denunciasPorMes),
        datasets: [
            {
                label: 'Denuncias por Mes',
                data: Object.values(analytics.denunciasPorMes),
                borderColor: 'rgb(248, 113, 113)', // red-400
                backgroundColor: 'rgba(248, 113, 113, 0.2)', // red-400 with opacity
                tension: 0.4,
                pointBackgroundColor: 'rgb(248, 113, 113)',
                pointBorderColor: 'rgb(248, 113, 113)',
                pointHoverBackgroundColor: 'rgb(220, 38, 38)', // red-600
                pointHoverBorderColor: 'rgb(220, 38, 38)',
            },
        ],
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-zinc-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 min-h-screen bg-zinc-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white border border-red-700/50 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <BarChart3 className="h-8 w-8 mr-3" />
                            Análisis de Datos
                        </h1>
                        <p className="text-red-100">
                            {comunidad?.nombre} - Últimos {dateRange} días
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => currentUser?.comunidadId && loadAnalyticsData(currentUser.comunidadId)}
                            disabled={refreshing}
                            className="flex items-center px-4 py-2 bg-zinc-800/50 backdrop-blur-sm rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-700/50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                        <button 
                            onClick={exportToExcel}
                            className="flex items-center px-4 py-2 bg-zinc-800/50 backdrop-blur-sm rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-700/50"
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exportar CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-red-400" />
                        <span className="font-medium text-zinc-300">Rango de fechas:</span>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-3 py-2 bg-zinc-700/50 border-2 border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400 text-white"
                        >
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="90">Últimos 3 meses</option>
                            <option value="365">Último año</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-400" />
                            <span className="text-zinc-300">Total: {analytics.totalDenuncias}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span className="text-zinc-300">Resolución: {analytics.tasaResolucion.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-300 text-sm font-medium">Total</p>
                            <p className="text-2xl font-bold text-white">{analytics.totalDenuncias}</p>
                        </div>
                        <Database className="h-8 w-8 text-red-400" />
                    </div>
                </div>

                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-300 text-sm font-medium">Pendientes</p>
                            <p className="text-2xl font-bold text-white">{analytics.denunciasPorEstado['pendiente'] || 0}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-400" />
                    </div>
                </div>

                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-300 text-sm font-medium">Resueltas</p>
                            <p className="text-2xl font-bold text-white">{analytics.denunciasPorEstado['resuelta'] || 0}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-700/50 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-300 text-sm font-medium">Tasa Resolución</p>
                            <p className="text-2xl font-bold text-white">{analytics.tasaResolucion.toFixed(1)}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de estados */}
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-zinc-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <PieChart className="h-5 w-5 text-red-400 mr-2" />
                        Distribución por Estado
                    </h3>
                    {Object.keys(analytics.denunciasPorEstado).length > 0 ? (
                        <Pie data={estadosChartData} options={chartOptions} />
                    ) : (
                        <div className="text-center py-8 text-zinc-400">No hay datos disponibles</div>
                    )}
                </div>

                {/* Gráfico de tipos */}
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-zinc-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <BarChart3 className="h-5 w-5 text-red-400 mr-2" />
                        Denuncias por Categoría
                    </h3>
                    {Object.keys(analytics.denunciasPorTipo).length > 0 ? (
                        <Bar data={tiposChartData} options={chartOptions} />
                    ) : (
                        <div className="text-center py-8 text-zinc-400">No hay datos disponibles</div>
                    )}
                </div>
            </div>

            {/* Gráfico de tendencia */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-zinc-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-red-400 mr-2" />
                    Tendencia Temporal
                </h3>
                {Object.keys(analytics.denunciasPorMes).length > 0 ? (
                    <Line data={tendenciaChartData} options={chartOptions} />
                ) : (
                    <div className="text-center py-8 text-zinc-400">No hay datos disponibles</div>
                )}
            </div>
        </div>
    );
};

export default Datos;

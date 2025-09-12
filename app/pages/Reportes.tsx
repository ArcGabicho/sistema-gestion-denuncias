'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  Eye,
  Trash2
} from 'lucide-react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { User } from '../interfaces/User';
import { Comunidad } from '../interfaces/Comunidad';
import { DenunciaInterna } from '../interfaces/DenunciaInterna';
import { 
  generarReporteLegal, 
  exportarReporteAPDF, 
  ReporteLegal, 
  OpcionesReporte,
  obtenerEstadisticasReportes,
  cargarReportesPorComunidad,
  eliminarReporteDeFirebase,
  descargarReporteDesdeFirebase
} from '../services/reportService';
import toast from 'react-hot-toast';

const Reportes = () => {
  // Estados principales
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comunidad, setComunidad] = useState<Comunidad | null>(null);
  const [denunciasInternas, setDenunciasInternas] = useState<DenunciaInterna[]>([]);
  const [reportesGenerados, setReportesGenerados] = useState<ReporteLegal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoReportes, setCargandoReportes] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  
  // Estados de UI
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<DenunciaInterna | null>(null);
  const [reporteVisualizando, setReporteVisualizando] = useState<ReporteLegal | null>(null);
  
  // Opciones del reporte
  const [opcionesReporte, setOpcionesReporte] = useState<OpcionesReporte>({
    incluirFundamentoLegal: true,
    incluirRecomendaciones: true,
    incluirAnalisisRiesgo: true,
    tipoReporte: 'detallado'
  });

  // Cargar usuario autenticado y denuncias de su comunidad
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar datos del usuario
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          setCurrentUser(userData);

          if (userData.comunidadId) {
            // Cargar datos de la comunidad
            const comunidadDoc = await getDoc(doc(db, "comunidades", userData.comunidadId));
            if (comunidadDoc.exists()) {
              const comunidadData = { id: comunidadDoc.id, ...comunidadDoc.data() } as Comunidad;
              setComunidad(comunidadData);
              
              // Cargar denuncias internas de la comunidad
              const denunciasInternasRef = collection(db, 'denuncias_internas');
              const queryInternas = query(
                denunciasInternasRef, 
                where('comunidadId', '==', userData.comunidadId),
                orderBy('fechaCreacion', 'desc'), 
                limit(50)
              );
              const snapshotInternas = await getDocs(queryInternas);
              const internasData = snapshotInternas.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as DenunciaInterna[];

              setDenunciasInternas(internasData);
              
              // Cargar reportes existentes de la comunidad (sin bloquear si falla)
              try {
                await cargarReportesExistentes(userData.comunidadId);
              } catch (reportError) {
                console.warn('No se pudieron cargar reportes existentes, continuando:', reportError);
                // No mostrar error al usuario, solo log
              }
            }
          }
        }
      } catch (error) {
        console.error('Error cargando datos principales:', error);
        toast.error('Error al cargar los datos de la aplicación');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Función para cargar reportes existentes de Firebase
  const cargarReportesExistentes = async (comunidadId: string) => {
    try {
      setCargandoReportes(true);
      console.log(`Cargando reportes para la comunidad: ${comunidadId}`);
      
      const reportesExistentes = await cargarReportesPorComunidad(comunidadId);
      setReportesGenerados(reportesExistentes);
      
      if (reportesExistentes.length === 0) {
        console.log('No se encontraron reportes existentes para esta comunidad - esto es normal');
      } else {
        console.log(`✅ Se cargaron ${reportesExistentes.length} reportes existentes correctamente`);
        toast.success(`${reportesExistentes.length} reportes cargados desde Firebase`, {
          duration: 2000,
          id: 'reportes-cargados'
        });
      }
      
    } catch (error) {
      console.error('Error crítico cargando reportes existentes:', error);
      // Solo mostrar error si es realmente crítico, no cuando no hay reportes
      toast.error('Error de conexión al cargar reportes');
      setReportesGenerados([]); // Asegurar que sea un array vacío
    } finally {
      setCargandoReportes(false);
    }
  };

  // Función para generar reporte
  const handleGenerarReporte = async (denuncia: DenunciaInterna) => {
    if (!currentUser?.comunidadId) {
      toast.error('No se puede generar el reporte sin comunidad');
      return;
    }

    try {
      setGenerandoReporte(true);
      toast.loading('Generando reporte legal con IA...', { id: 'generando' });
      
      const reporte = await generarReporteLegal(denuncia, opcionesReporte, currentUser.comunidadId);
      
      setReportesGenerados(prev => [reporte, ...prev]);
      setMostrarOpciones(false);
      setDenunciaSeleccionada(null);
      
      toast.success('¡Reporte legal generado y guardado exitosamente!', { id: 'generando' });
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      toast.error('Error al generar el reporte legal', { id: 'generando' });
    } finally {
      setGenerandoReporte(false);
    }
  };

  // Función para eliminar reporte
  const handleEliminarReporte = async (reporte: ReporteLegal) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      toast.loading('Eliminando reporte...', { id: 'eliminando' });
      await eliminarReporteDeFirebase(reporte);
      setReportesGenerados(prev => prev.filter(r => r.id !== reporte.id));
      toast.success('Reporte eliminado exitosamente', { id: 'eliminando' });
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      toast.error('Error al eliminar el reporte', { id: 'eliminando' });
    }
  };

  // Función para descargar reporte
  const handleDescargarReporte = async (reporte: ReporteLegal) => {
    try {
      if (reporte.storageUrl) {
        // Descargar desde Firebase Storage
        await descargarReporteDesdeFirebase(reporte);
      } else {
        // Generar y descargar contenido local (compatibilidad)
        const contenidoPDF = await exportarReporteAPDF(reporte);
        // Convertir a array de bytes para máxima compatibilidad
        const byteArray = (contenidoPDF instanceof Uint8Array)
          ? Array.from(contenidoPDF)
          : Array.from(new Uint8Array(contenidoPDF));
        const blob = new Blob([new Uint8Array(byteArray)], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_legal_${reporte.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      toast.success('Reporte descargado exitosamente');
    } catch (error) {
      console.error('Error descargando reporte:', error);
      toast.error('Error al descargar el reporte');
    }
  };

  // Filtrar denuncias
  const denunciasFiltradas = () => {
    return denunciasInternas.filter(denuncia => {
      const coincideBusqueda = denuncia.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                              denuncia.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      
      let coincideEstado = true;
      if (estadoFiltro !== 'todos') {
        coincideEstado = denuncia.estado === estadoFiltro;
      }

      return coincideBusqueda && coincideEstado;
    });
  };

  const estadisticas = obtenerEstadisticasReportes(reportesGenerados);

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'text-red-300 bg-red-500/20 border border-red-500/30';
      case 'alta': return 'text-orange-300 bg-orange-500/20 border border-orange-500/30';
      case 'media': return 'text-yellow-300 bg-yellow-500/20 border border-yellow-500/30';
      case 'baja': return 'text-green-300 bg-green-500/20 border border-green-500/30';
      default: return 'text-zinc-300 bg-zinc-500/20 border border-zinc-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-zinc-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white border border-red-700/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reportes Legales</h1>
            <p className="text-red-100">
              Genera reportes legales automáticos con IA para las denuncias de {comunidad?.nombre || 'tu comunidad'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={async () => {
                try {
                  toast.loading('Probando conectividad...', { id: 'diagnostics' });
                  const response = await fetch('/api/diagnostics', { method: 'POST' });
                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success('✅ Conectividad OK', { id: 'diagnostics' });
                  } else {
                    toast.error(`❌ Error: ${result.error}`, { id: 'diagnostics' });
                  }
                } catch {
                  toast.error('❌ Error de conectividad', { id: 'diagnostics' });
                }
              }}
              className="px-3 py-2 bg-red-700/50 hover:bg-red-700 rounded-lg text-sm transition-colors"
              title="Probar conectividad con IA"
            >
              🔧 Test IA
            </button>
            <FileText className="h-16 w-16 text-red-200" />
          </div>
        </div>
      </div>

      {/* Estadísticas de Reportes */}
      {reportesGenerados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-zinc-700/50">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-zinc-300">Total Reportes</p>
                <p className="text-2xl font-bold text-white">{estadisticas.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-zinc-700/50">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-zinc-300">Prioridad Urgente</p>
                <p className="text-2xl font-bold text-white">{estadisticas.porPrioridad.urgente}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-zinc-700/50">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-zinc-300">Denuncias Disponibles</p>
                <p className="text-2xl font-bold text-white">{denunciasInternas.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-zinc-700/50">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-zinc-300">Pendientes</p>
                <p className="text-2xl font-bold text-white">{denunciasInternas.filter(d => d.estado === 'pendiente').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-zinc-700/50">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-indigo-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-zinc-300">En Storage</p>
                <p className="text-2xl font-bold text-white">{estadisticas.reportesEnStorage}</p>
                {estadisticas.tamañoTotal > 0 && (
                  <p className="text-xs text-zinc-500">
                    {(estadisticas.tamañoTotal / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-zinc-700/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Buscar Denuncia
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título o descripción..."
                className="pl-10 w-full p-2 bg-zinc-700/50 border border-zinc-600 rounded-md focus:ring-red-500 focus:border-red-500 text-white placeholder-zinc-400"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Total Denuncias
            </label>
            <div className="w-full p-2 bg-zinc-700/50 border border-zinc-600 rounded-md text-white">
              {denunciasInternas.length} denuncias internas
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full p-2 bg-zinc-700/50 border border-zinc-600 rounded-md focus:ring-red-500 focus:border-red-500 text-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="en_revision">En Revisión</option>
              <option value="resuelta">Resuelta</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setBusqueda('');
                setEstadoFiltro('todos');
              }}
              className="w-full px-4 py-2 bg-zinc-600 text-white rounded-md hover:bg-zinc-500 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Denuncias */}
      <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-zinc-700/50">
        <div className="p-6 border-b border-zinc-700/50">
          <h2 className="text-xl font-semibold text-white">Denuncias Disponibles</h2>
          <p className="text-zinc-300">
            Selecciona una denuncia para generar un reporte legal 
            {currentUser && ` • Usuario: ${currentUser.name} ${currentUser.lastname}`}
          </p>
        </div>
        
        <div className="divide-y divide-zinc-700/50">
          {denunciasFiltradas().map((denuncia) => (
            <div key={denuncia.id} className="p-6 hover:bg-zinc-700/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-white">{denuncia.titulo}</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Interna
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      denuncia.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      denuncia.estado === 'en_proceso' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      denuncia.estado === 'resuelta' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {denuncia.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-zinc-400 mb-2 line-clamp-2">{denuncia.descripcion}</p>
                  
                  <div className="flex items-center text-sm text-zinc-500 space-x-4">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {denuncia.fechaCreacion.toDate().toLocaleDateString()}
                    </span>
                    <span>
                      Categoría: {denuncia.tipo}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setDenunciaSeleccionada(denuncia);
                      setMostrarOpciones(true);
                    }}
                    disabled={generandoReporte}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-red-500/30"
                  >
                    {generandoReporte ? 'Generando...' : 'Generar Reporte'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {denunciasFiltradas().length === 0 && (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-zinc-500" />
              <h3 className="mt-2 text-sm font-medium text-white">No hay denuncias</h3>
              <p className="mt-1 text-sm text-zinc-400">
                No se encontraron denuncias que coincidan con los filtros seleccionados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reportes Generados */}
      {reportesGenerados.length > 0 && (
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-zinc-700/50">
          <div className="p-6 border-b border-zinc-700/50">
            <h2 className="text-xl font-semibold text-white">Reportes Generados</h2>
            <p className="text-zinc-300">Historial de reportes legales generados</p>
          </div>
          
          <div className="divide-y divide-zinc-700/50">
            {reportesGenerados.map((reporte) => (
              <div key={reporte.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-white">{reporte.titulo}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadColor(reporte.prioridad)}`}>
                        {reporte.prioridad.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reporte.tipo === 'interno' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {reporte.tipo === 'interno' ? 'Interna' : 'Pública'}
                      </span>
                      {reporte.storageUrl && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          EN STORAGE
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-zinc-400 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {reporte.fechaGeneracion.toLocaleDateString()}
                      </span>
                      <span>{reporte.recomendaciones.length} recomendaciones</span>
                      {reporte.tamaño && (
                        <span>{(reporte.tamaño / 1024).toFixed(1)} KB</span>
                      )}
                      {reporte.fileName && (
                        <span className="text-xs text-zinc-500">
                          {reporte.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setReporteVisualizando(reporte)}
                      className="px-3 py-2 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDescargarReporte(reporte)}
                      className="px-3 py-2 text-green-400 hover:bg-green-500/20 rounded-md transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarReporte(reporte)}
                      className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado cuando se están cargando reportes */}
      {cargandoReportes && (
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-zinc-700/50 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-zinc-300 text-lg">Cargando reportes existentes...</p>
          </div>
        </div>
      )}

      {/* Estado cuando no hay reportes */}
      {!cargandoReportes && !loading && reportesGenerados.length === 0 && (
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-zinc-700/50 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-16 w-16 text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay reportes generados aún</h3>
            <p className="text-zinc-400 mb-6">
              Selecciona una denuncia de la lista para generar tu primer reporte legal con IA
            </p>
            <div className="text-sm text-zinc-500">
              {comunidad?.nombre && `Comunidad: ${comunidad.nombre}`}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Opciones de Reporte */}
      {mostrarOpciones && denunciaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Opciones del Reporte</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Reporte
                </label>
                <select
                  value={opcionesReporte.tipoReporte}
                  onChange={(e) => setOpcionesReporte({
                    ...opcionesReporte,
                    tipoReporte: e.target.value as 'ejecutivo' | 'detallado' | 'legal'
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                >
                  <option value="ejecutivo">Ejecutivo (Conciso)</option>
                  <option value="detallado">Detallado (Completo)</option>
                  <option value="legal">Legal (Enfoque Jurídico)</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={opcionesReporte.incluirFundamentoLegal}
                    onChange={(e) => setOpcionesReporte({
                      ...opcionesReporte,
                      incluirFundamentoLegal: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Incluir Fundamento Legal</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={opcionesReporte.incluirRecomendaciones}
                    onChange={(e) => setOpcionesReporte({
                      ...opcionesReporte,
                      incluirRecomendaciones: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Incluir Recomendaciones</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={opcionesReporte.incluirAnalisisRiesgo}
                    onChange={(e) => setOpcionesReporte({
                      ...opcionesReporte,
                      incluirAnalisisRiesgo: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Incluir Análisis de Riesgo</span>
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleGenerarReporte(denunciaSeleccionada)}
                disabled={generandoReporte}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generandoReporte ? 'Generando...' : 'Generar Reporte'}
              </button>
              <button
                onClick={() => {
                  setMostrarOpciones(false);
                  setDenunciaSeleccionada(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualización de Reporte Mejorado */}
      {reporteVisualizando && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">{reporteVisualizando.titulo}</h2>
                  <div className="flex items-center space-x-4 mt-1 text-red-100">
                    <span className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {reporteVisualizando.fechaGeneracion.toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadColor(reporteVisualizando.prioridad)}`}>
                      {reporteVisualizando.prioridad.toUpperCase()}
                    </span>
                    <span className="text-sm">
                      ID: {reporteVisualizando.id.split('_')[1]}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReporteVisualizando(null)}
                className="text-red-100 hover:text-white hover:bg-red-700/50 rounded-lg p-2 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Metadata del Reporte */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Tipo:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {reporteVisualizando.tipo === 'interno' ? 'Denuncia Interna' : 'Denuncia Pública'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Recomendaciones:</span>
                  <span className="text-gray-600">{reporteVisualizando.recomendaciones.length} incluidas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Fundamento Legal:</span>
                  <span className="text-gray-600">
                    {reporteVisualizando.fundamentoLegal ? 'Incluido' : 'No incluido'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Contenido del Reporte */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <style jsx>{`
                .formatted-report h2 {
                  scroll-margin-top: 2rem;
                }
                .formatted-report .section-title {
                  margin-top: 2rem;
                }
                .formatted-report .section-title:first-child {
                  margin-top: 0;
                }
                .list-section ul {
                  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                  border-radius: 0.75rem;
                  padding: 1.5rem;
                  border: 1px solid #e2e8f0;
                }
                .paragraph-section p {
                  text-indent: 1rem;
                  line-height: 1.8;
                }
                .formatted-report {
                  font-family: 'Georgia', serif;
                }
                .report-nav {
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  background: rgba(255, 255, 255, 0.95);
                  backdrop-filter: blur(10px);
                  border-bottom: 1px solid #e2e8f0;
                }
                @media print {
                  .report-nav { display: none; }
                }
              `}</style>
              
              {/* Navegación del Reporte */}
              <div className="report-nav p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">Navegación:</span>
                    <div className="flex space-x-2">
                      {reporteVisualizando.contenido.split('\n\n')
                        .filter(parrafo => {
                          const texto = parrafo.trim();
                          return texto.match(/^(REPORTE\s+LEGAL|FUNDAMENTO\s+LEGAL|RECOMENDACIONES|ANÁLISIS\s+DE\s+RIESGO|CONCLUSIONES?|ANTECEDENTES|RESUMEN\s+EJECUTIVO)/i);
                        })
                        .slice(0, 5)
                        .map((seccion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              const elemento = document.querySelector(`#seccion-${index}`);
                              elemento?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            {seccion.trim().substring(0, 15)}...
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.ceil(reporteVisualizando.contenido.length / 1000)} min lectura
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="prose max-w-none">
                <div className="formatted-report space-y-6">
                  {reporteVisualizando.contenido.split('\n\n').map((parrafo, index) => {
                    const texto = parrafo.trim();
                    if (!texto) return null;

                    // Detectar títulos principales (todo en mayúsculas, palabras clave específicas)
                    const esTituloPrincipal = texto.match(/^(REPORTE\s+LEGAL|FUNDAMENTO\s+LEGAL|RECOMENDACIONES|ANÁLISIS\s+DE\s+RIESGO|CONCLUSIONES?|ANTECEDENTES|RESUMEN\s+EJECUTIVO)/i) ||
                                            (texto.match(/^[A-ZÁÉÍÓÚÑ\s\d\.\-:]+$/m) && texto.length < 80 && !texto.includes('.'));
                    
                    if (esTituloPrincipal) {
                      return (
                        <div key={index} className="section-title">
                          <h2 className="text-2xl font-bold text-gray-900 border-b-3 border-red-600 pb-3 mb-6 flex items-center bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-t-lg">
                            <span className="bg-red-600 text-white px-3 py-1 rounded-md text-sm mr-4 font-bold">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="text-red-800">{texto}</span>
                          </h2>
                        </div>
                      );
                    }

                    // Detectar subtítulos
                    const esSubtitulo = texto.match(/^\d+\.\s+[A-ZÁÉÍÓÚ]/) || 
                                      texto.match(/^[A-Z][a-záéíóúñ\s]+:$/) ||
                                      (texto.length < 60 && texto.endsWith(':'));
                    
                    if (esSubtitulo) {
                      return (
                        <div key={index} className="subsection-title">
                          <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                            <span className="w-2 h-6 bg-red-500 mr-3 rounded"></span>
                            {texto}
                          </h4>
                        </div>
                      );
                    }
                    
                    // Detectar listas (líneas que empiecen con - o • o números)
                    if (texto.match(/^[-•*]\s+/) || texto.includes('- ') || texto.includes('• ')) {
                      const items = texto.split(/\n?[-•*]\s+/).filter(item => item.trim());
                      return (
                        <div key={index} className="list-section">
                          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-lg p-4">
                            <ul className="space-y-3">
                              {items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start space-x-3">
                                  <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-sm">
                                    {itemIndex + 1}
                                  </span>
                                  <div className="flex-1">
                                    <span className="text-gray-800 leading-relaxed font-medium">{item.trim()}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    }

                    // Detectar citas legales o referencias normativas
                    const esCitaLegal = texto.match(/(Ley\s+N°|Decreto|Ordenanza|Código|Artículo|Reglamento)/i);
                    if (esCitaLegal) {
                      return (
                        <div key={index} className="legal-citation">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <div className="flex items-start space-x-3">
                              <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                              <p className="text-blue-900 leading-relaxed font-medium italic">
                                {texto}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Párrafos normales con mejor styling
                    return (
                      <div key={index} className="paragraph-section">
                        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-gray-800 leading-relaxed text-justify">
                            {texto}
                          </p>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            
            {/* Sección de Recomendaciones Destacadas */}
            {reporteVisualizando.recomendaciones.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Recomendaciones Clave
                </h4>
                <div className="grid gap-3">
                  {reporteVisualizando.recomendaciones.slice(0, 5).map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fundamento Legal Destacado */}
            {reporteVisualizando.fundamentoLegal && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Marco Legal Aplicable
                </h4>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {reporteVisualizando.fundamentoLegal}
                  </p>
                </div>
              </div>
            )}
                </div>
              </div>
            
            {/* Footer con Acciones */}
            <div className="bg-gray-50 p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Generado por:</span> Sistema de Gestión de Denuncias • 
                <span className="font-medium"> Comunidad:</span> {comunidad?.nombre}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md"
                >
                  <FileText className="h-4 w-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => handleDescargarReporte(reporteVisualizando)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar</span>
                </button>
                <button
                  onClick={() => setReporteVisualizando(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                >
                  Cerrar Vista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
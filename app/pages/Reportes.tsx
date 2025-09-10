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
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DenunciaInterna } from '../interfaces/DenunciaInterna';
import { DenunciaPublica } from '../interfaces/DenunciaPublica';
import { 
  generarReporteLegal, 
  exportarReporteAPDF, 
  ReporteLegal, 
  OpcionesReporte,
  obtenerEstadisticasReportes 
} from '../services/reportService';
import toast from 'react-hot-toast';

const Reportes = () => {
  // Estados principales
  const [denunciasInternas, setDenunciasInternas] = useState<DenunciaInterna[]>([]);
  const [denunciasPublicas, setDenunciasPublicas] = useState<DenunciaPublica[]>([]);
  const [reportesGenerados, setReportesGenerados] = useState<ReporteLegal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  
  // Estados de UI
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todas' | 'internas' | 'publicas'>('todas');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<DenunciaInterna | DenunciaPublica | null>(null);
  const [reporteVisualizando, setReporteVisualizando] = useState<ReporteLegal | null>(null);
  
  // Opciones del reporte
  const [opcionesReporte, setOpcionesReporte] = useState<OpcionesReporte>({
    incluirFundamentoLegal: true,
    incluirRecomendaciones: true,
    incluirAnalisisRiesgo: true,
    tipoReporte: 'detallado'
  });

  // Cargar denuncias desde Firebase
  useEffect(() => {
    const cargarDenuncias = async () => {
      try {
        setLoading(true);
        
        // Cargar denuncias internas
        const denunciasInternasRef = collection(db, 'denunciasInternas');
        const queryInternas = query(denunciasInternasRef, orderBy('fechaCreacion', 'desc'), limit(50));
        const snapshotInternas = await getDocs(queryInternas);
        const internasData = snapshotInternas.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DenunciaInterna[];

        // Cargar denuncias públicas
        const denunciasPublicasRef = collection(db, 'denunciasPublicas');
        const queryPublicas = query(denunciasPublicasRef, orderBy('fechaCreacion', 'desc'), limit(50));
        const snapshotPublicas = await getDocs(queryPublicas);
        const publicasData = snapshotPublicas.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DenunciaPublica[];

        setDenunciasInternas(internasData);
        setDenunciasPublicas(publicasData);
        
      } catch (error) {
        console.error('Error cargando denuncias:', error);
        toast.error('Error al cargar las denuncias');
      } finally {
        setLoading(false);
      }
    };

    cargarDenuncias();
  }, []);

  // Función para generar reporte
  const handleGenerarReporte = async (denuncia: DenunciaInterna | DenunciaPublica) => {
    try {
      setGenerandoReporte(true);
      toast.loading('Generando reporte legal con IA...', { id: 'generando' });
      
      const reporte = await generarReporteLegal(denuncia, opcionesReporte);
      
      setReportesGenerados(prev => [reporte, ...prev]);
      setMostrarOpciones(false);
      setDenunciaSeleccionada(null);
      
      toast.success('¡Reporte legal generado exitosamente!', { id: 'generando' });
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      toast.error('Error al generar el reporte legal', { id: 'generando' });
    } finally {
      setGenerandoReporte(false);
    }
  };

  // Función para descargar reporte
  const handleDescargarReporte = async (reporte: ReporteLegal) => {
    try {
      const contenido = await exportarReporteAPDF(reporte);
      const blob = new Blob([contenido], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_legal_${reporte.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Reporte descargado exitosamente');
    } catch (error) {
      console.error('Error descargando reporte:', error);
      toast.error('Error al descargar el reporte');
    }
  };

  // Filtrar denuncias
  const denunciasFiltradas = () => {
    let todas: (DenunciaInterna | DenunciaPublica)[] = [];
    
    if (tipoFiltro === 'todas' || tipoFiltro === 'internas') {
      todas = [...todas, ...denunciasInternas];
    }
    if (tipoFiltro === 'todas' || tipoFiltro === 'publicas') {
      todas = [...todas, ...denunciasPublicas];
    }

    return todas.filter(denuncia => {
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
    <div className="space-y-6 p-6 min-h-screen bg-zinc-900">{/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white border border-red-700/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reportes Legales</h1>
            <p className="text-red-100">Genera reportes legales automáticos con IA para tus denuncias</p>
          </div>
          <FileText className="h-16 w-16 text-red-200" />
        </div>
      </div>

      {/* Estadísticas de Reportes */}
      {reportesGenerados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-sm font-medium text-zinc-300">Denuncias Internas</p>
                <p className="text-2xl font-bold text-white">{estadisticas.porTipo.interno}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-zinc-700/50">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-zinc-300">Denuncias Públicas</p>
                <p className="text-2xl font-bold text-white">{estadisticas.porTipo.publico}</p>
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
              Tipo de Denuncia
            </label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as 'todas' | 'internas' | 'publicas')}
              className="w-full p-2 bg-zinc-700/50 border border-zinc-600 rounded-md focus:ring-red-500 focus:border-red-500 text-white"
            >
              <option value="todas">Todas</option>
              <option value="internas">Denuncias Internas</option>
              <option value="publicas">Denuncias Públicas</option>
            </select>
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
                setTipoFiltro('todas');
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
          <p className="text-zinc-300">Selecciona una denuncia para generar un reporte legal</p>
        </div>
        
        <div className="divide-y divide-zinc-700/50">
          {denunciasFiltradas().map((denuncia) => {
            const esInterna = 'tipo' in denuncia && 'comunidadId' in denuncia;
            return (
              <div key={denuncia.id} className="p-6 hover:bg-zinc-700/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-white">{denuncia.titulo}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        esInterna ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {esInterna ? 'Interna' : 'Pública'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        denuncia.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        denuncia.estado === 'en_proceso' || denuncia.estado === 'en_revision' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {denuncia.estado.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-zinc-400 mb-2 line-clamp-2">{denuncia.descripcion}</p>
                    
                    <div className="flex items-center text-sm text-zinc-500 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {esInterna 
                          ? (denuncia as DenunciaInterna).fechaCreacion.toDate().toLocaleDateString()
                          : new Date((denuncia as DenunciaPublica).fechaCreacion).toLocaleDateString()
                        }
                      </span>
                      <span>
                        Categoría: {esInterna ? (denuncia as DenunciaInterna).tipo : (denuncia as DenunciaPublica).categoria}
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
            );
          })}
          
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
                    </div>
                    
                    <div className="flex items-center text-sm text-zinc-400 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {reporte.fechaGeneracion.toLocaleDateString()}
                      </span>
                      <span>{reporte.recomendaciones.length} recomendaciones</span>
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
                      onClick={() => {
                        setReportesGenerados(prev => prev.filter(r => r.id !== reporte.id));
                        toast.success('Reporte eliminado');
                      }}
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

      {/* Modal de Visualización de Reporte */}
      {reporteVisualizando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{reporteVisualizando.titulo}</h3>
              <button
                onClick={() => setReporteVisualizando(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                {reporteVisualizando.contenido}
              </pre>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleDescargarReporte(reporteVisualizando)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Descargar
              </button>
              <button
                onClick={() => setReporteVisualizando(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
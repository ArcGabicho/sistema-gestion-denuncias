/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,  
  Plus, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/app/utils/firebase';
import { DenunciaInterna, FALTAS_ADMINISTRATIVAS, FaltaAdministrativa } from '@/app/interfaces/DenunciaInterna';
import { toast } from 'react-hot-toast';

interface DenunciaFormData {
  titulo: string;
  descripcion: string;
  tipo: FaltaAdministrativa;
  comunidadId: string;
  ubicacion: string;
  anonima: boolean;
  evidencias: File[];
}

const Denuncias = () => {
  const [denuncias, setDenuncias] = useState<DenunciaInterna[]>([]);
  const [filteredDenuncias, setFilteredDenuncias] = useState<DenunciaInterna[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('todas');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDenuncia, setSelectedDenuncia] = useState<DenunciaInterna | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Comunidad actual - por ahora hardcodeada, pero debería venir del contexto de usuario/auth
  const [currentCommunityId] = useState('comunidad-general');

  const [formData, setFormData] = useState<DenunciaFormData>({
    titulo: '',
    descripcion: '',
    tipo: 'otros',
    comunidadId: currentCommunityId, // Usar la comunidad actual
    ubicacion: '',
    anonima: false,
    evidencias: []
  });

  const loadDenuncias = useCallback(async () => {
    try {
      // Filtrar denuncias solo de la comunidad actual
      const q = query(
        collection(db, 'denuncias_internas'), 
        where('comunidadId', '==', currentCommunityId),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const denunciasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DenunciaInterna[];
      
      setDenuncias(denunciasData);
    } catch (error) {
      console.error('Error loading denuncias:', error);
      toast.error('Error al cargar las denuncias');
      // Si hay error con el filtro, mostrar lista vacía en lugar de todas las denuncias
      setDenuncias([]);
    } finally {
      setLoading(false);
    }
  }, [currentCommunityId]);

  // Cargar denuncias
  useEffect(() => {
    loadDenuncias();
  }, [loadDenuncias]);

  // Filtrar denuncias
  useEffect(() => {
    let filtered = [...denuncias];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(denuncia => 
        denuncia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        denuncia.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        denuncia.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (selectedFilter !== 'todas') {
      filtered = filtered.filter(denuncia => denuncia.estado === selectedFilter);
    }

    // Filtro por tipo
    if (selectedTipo !== 'todos') {
      filtered = filtered.filter(denuncia => denuncia.tipo === selectedTipo);
    }

    setFilteredDenuncias(filtered);
  }, [denuncias, searchTerm, selectedFilter, selectedTipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descripcion) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      // Subir evidencias si las hay
      let evidenciaUrls: string[] = [];
      if (formData.evidencias.length > 0) {
        evidenciaUrls = await uploadEvidencias(formData.evidencias);
      }

      // Crear denuncia
      const denunciaData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        estado: 'pendiente' as const,
        comunidadId: formData.comunidadId,
        denuncianteId: formData.anonima ? undefined : auth.currentUser?.uid,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
        ubicacion: formData.ubicacion,
        evidenciaUrls,
        anonima: formData.anonima
      };

      await addDoc(collection(db, 'denuncias_internas'), denunciaData);
      
      toast.success('Denuncia creada exitosamente');
      setShowModal(false);
      resetForm();
      loadDenuncias();
    } catch (error) {
      console.error('Error creating denuncia:', error);
      toast.error('Error al crear la denuncia');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadEvidencias = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fileName = `evidencias/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'otros',
      comunidadId: currentCommunityId, // Usar la comunidad actual
      ubicacion: '',
      anonima: false,
      evidencias: []
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'en_proceso': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'resuelta': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rechazada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock className="h-4 w-4" />;
      case 'en_proceso': return <AlertCircle className="h-4 w-4" />;
      case 'resuelta': return <CheckCircle className="h-4 w-4" />;
      case 'rechazada': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ruido: 'Ruido',
      basura: 'Basura',
      construccion: 'Construcción',
      seguridad: 'Seguridad',
      mascotas: 'Mascotas',
      ocupacion_espacio_publico: 'Ocupación Espacio Público',
      vandalismo: 'Vandalismo',
      vehiculos_mal_estacionados: 'Vehículos Mal Estacionados',
      iluminacion: 'Iluminación',
      otros: 'Otros'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex-shrink-0"
        >
          <h1 className="text-2xl font-bold text-white mb-1">
            Gestión de Denuncias
          </h1>
          <p className="text-zinc-400 text-sm">
            Administra y consulta todas las denuncias de la comunidad
          </p>
        </motion.div>

        {/* Barra de búsqueda y filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-4 mb-4 flex-shrink-0"
        >
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar denuncias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="todas">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="resuelta">Resuelta</option>
                <option value="rechazada">Rechazada</option>
              </select>

              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="todos">Todos los tipos</option>
                {FALTAS_ADMINISTRATIVAS.map(tipo => (
                  <option key={tipo} value={tipo}>{getTipoLabel(tipo)}</option>
                ))}
              </select>

              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold flex items-center gap-2 hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm"
              >
                <Plus className="h-4 w-4" />
                Nueva Denuncia
              </button>
            </div>
          </div>
        </motion.div>

        {/* Lista de denuncias */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2">
            <div className="space-y-3">
              <AnimatePresence>
                {filteredDenuncias.map((denuncia) => (
                  <motion.div
                    key={denuncia.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-4 hover:border-zinc-600 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start gap-4">
                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        {/* Header con título y estado */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-1 truncate">
                              {denuncia.titulo}
                            </h3>
                          </div>
                          <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 whitespace-nowrap ${getEstadoColor(denuncia.estado)}`}>
                            {getEstadoIcon(denuncia.estado)}
                            {denuncia.estado.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>

                        {/* Descripción */}
                        <p className="text-zinc-300 text-sm mb-3 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {denuncia.descripcion}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span>{getTipoLabel(denuncia.tipo)}</span>
                          </div>
                          {denuncia.ubicacion && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{denuncia.ubicacion}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDate(denuncia.fechaCreacion)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span>{denuncia.anonima ? 'Anónimo' : 'Usuario registrado'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedDenuncia(denuncia);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-2 bg-zinc-700/50 text-white rounded-lg flex items-center gap-2 hover:bg-zinc-600/50 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredDenuncias.length === 0 && !loading && (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
                  {denuncias.length === 0 ? (
                    <>
                      <p className="text-zinc-400 text-base">No hay denuncias en tu comunidad</p>
                      <p className="text-zinc-500 text-sm">Sé el primero en crear una denuncia para tu comunidad</p>
                    </>
                  ) : (
                    <>
                      <p className="text-zinc-400 text-base">No se encontraron denuncias</p>
                      <p className="text-zinc-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal para crear denuncia */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-800 rounded-xl border border-zinc-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Nueva Denuncia</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Título de la denuncia *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Describe brevemente el problema"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Tipo de denuncia *
                    </label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as FaltaAdministrativa})}
                      className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {FALTAS_ADMINISTRATIVAS.map(tipo => (
                        <option key={tipo} value={tipo}>{getTipoLabel(tipo)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Descripción detallada *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Describe los detalles de la situación"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                      className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Dirección o referencia del lugar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Evidencias (opcional)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={(e) => setFormData({...formData, evidencias: Array.from(e.target.files || [])})}
                      className="w-full px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Puedes subir fotos, videos o documentos como evidencia
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonima"
                      checked={formData.anonima}
                      onChange={(e) => setFormData({...formData, anonima: e.target.checked})}
                      className="rounded bg-zinc-700 border-zinc-600 text-red-500 focus:ring-red-500"
                    />
                    <label htmlFor="anonima" className="text-sm text-zinc-300">
                      Realizar denuncia anónima
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50"
                    >
                      {submitting ? 'Enviando...' : 'Crear Denuncia'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal de detalles */}
        <AnimatePresence>
          {showDetailModal && selectedDenuncia && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-800 rounded-xl border border-zinc-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Detalles de la Denuncia</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{selectedDenuncia.titulo}</h3>
                    <div className={`inline-flex px-3 py-1 rounded-full border text-sm font-medium items-center gap-1 ${getEstadoColor(selectedDenuncia.estado)}`}>
                      {getEstadoIcon(selectedDenuncia.estado)}
                      {selectedDenuncia.estado.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-2">Descripción</h4>
                    <p className="text-zinc-300">{selectedDenuncia.descripcion}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-300 mb-1">Tipo</h4>
                      <p className="text-white">{getTipoLabel(selectedDenuncia.tipo)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-zinc-300 mb-1">Fecha</h4>
                      <p className="text-white">{formatDate(selectedDenuncia.fechaCreacion)}</p>
                    </div>
                  </div>

                  {selectedDenuncia.ubicacion && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-300 mb-1">Ubicación</h4>
                      <p className="text-white">{selectedDenuncia.ubicacion}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-1">Denunciante</h4>
                    <p className="text-white">{selectedDenuncia.anonima ? 'Anónimo' : 'Usuario registrado'}</p>
                  </div>

                  {selectedDenuncia.evidenciaUrls && selectedDenuncia.evidenciaUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-300 mb-2">Evidencias</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedDenuncia.evidenciaUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Evidencia ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-zinc-600"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Denuncias;
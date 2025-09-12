/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,  
  Plus, 
  MapPin, 
  Calendar, 
  User as UserIcon, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/app/utils/firebase';
import { DenunciaInterna, FALTAS_ADMINISTRATIVAS, FaltaAdministrativa } from '@/app/interfaces/DenunciaInterna';
import { toast } from 'react-hot-toast';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { User } from '@/app/interfaces/User';

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
  const [denuncianteInfo, setDenuncianteInfo] = useState<User | null>(null);
  const [loadingDenunciante, setLoadingDenunciante] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Comunidad actual - por ahora hardcodeada, pero debería venir del contexto de usuario/auth
  const [currentCommunityId, setCurrentCommunityId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setCurrentCommunityId(userData.comunidadId || '');
          setCurrentUser(userData);
        }
      } else {
        setCurrentUser(null);
        setCurrentCommunityId('');
      }
    });
    return () => unsubscribe();
  }, []);

  const [formData, setFormData] = useState<DenunciaFormData>({
    titulo: '',
    descripcion: '',
    tipo: 'otros',
    comunidadId: '', // Se actualizará cuando se obtenga el id real
    ubicacion: '',
    anonima: false,
    evidencias: []
  });

  useEffect(() => {
    if (currentCommunityId) {
      setFormData(prev => ({
        ...prev,
        comunidadId: currentCommunityId,
      }));
    }
  }, [currentCommunityId]);

  const loadDenuncias = useCallback(async () => {
    if (!currentCommunityId) {
      setDenuncias([]);
      setLoading(false);
      console.log("No hay comunidadId para filtrar denuncias");
      return;
    }
    try {
      console.log("Buscando denuncias para comunidadId:", currentCommunityId);
      const q = query(
        collection(db, 'denuncias_internas'), 
        where('comunidadId', '==', currentCommunityId),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      console.log("Denuncias encontradas:", querySnapshot.docs.length);
      if (querySnapshot.empty) {
        setDenuncias([]);
      } else {
        const denunciasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DenunciaInterna[];
        setDenuncias(denunciasData);
      }
    } catch (error) {
      console.error('Error loading denuncias:', error);
      toast.error('Error al cargar las denuncias');
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const denunciaData: any = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        estado: 'pendiente' as const,
        comunidadId: formData.comunidadId,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
        ubicacion: formData.ubicacion,
        evidenciaUrls,
        anonima: formData.anonima
      };
      if (!formData.anonima) {
        denunciaData.denuncianteId = auth.currentUser?.uid;
      }

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

  const loadDenuncianteInfo = async (denuncianteId: string) => {
    setLoadingDenunciante(true);
    try {
      const userDoc = await getDoc(doc(db, "users", denuncianteId));
      if (userDoc.exists()) {
        setDenuncianteInfo(userDoc.data() as User);
      } else {
        setDenuncianteInfo(null);
      }
    } catch (error) {
      console.error('Error loading denunciante info:', error);
      setDenuncianteInfo(null);
    } finally {
      setLoadingDenunciante(false);
    }
  };

  const handleEstadoChange = async (denunciaId: string, newEstado: 'pendiente' | 'en_proceso' | 'resuelta' | 'rechazada') => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast.error('No tienes permisos para cambiar el estado de las denuncias');
      return;
    }

    setUpdatingEstado(true);
    try {
      const denunciaRef = doc(db, 'denuncias_internas', denunciaId);
      await updateDoc(denunciaRef, {
        estado: newEstado,
        fechaActualizacion: Timestamp.now()
      });
      
      toast.success('Estado actualizado correctamente');
      loadDenuncias(); // Recargar la lista
      
      // Actualizar la denuncia seleccionada si está abierta
      if (selectedDenuncia && selectedDenuncia.id === denunciaId) {
        setSelectedDenuncia(prev => prev ? { ...prev, estado: newEstado } : null);
      }
    } catch (error) {
      console.error('Error updating estado:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdatingEstado(false);
    }
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
                            <UserIcon className="h-3 w-3 flex-shrink-0" />
                            <span>{denuncia.anonima ? 'Anónimo' : 'Usuario registrado'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={async () => {
                            setSelectedDenuncia(denuncia);
                            setShowDetailModal(true);
                            setDenuncianteInfo(null);
                            
                            // Cargar info del denunciante si no es anónima
                            if (!denuncia.anonima && denuncia.denuncianteId) {
                              await loadDenuncianteInfo(denuncia.denuncianteId);
                            }
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
                    onClick={() => {
                      setShowDetailModal(false);
                      setDenuncianteInfo(null);
                    }}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{selectedDenuncia.titulo}</h3>
                    <div className="flex items-center justify-between gap-4">
                      <div className={`inline-flex px-3 py-1 rounded-full border text-sm font-medium items-center gap-1 ${getEstadoColor(selectedDenuncia.estado)}`}>
                        {getEstadoIcon(selectedDenuncia.estado)}
                        {selectedDenuncia.estado.replace('_', ' ').toUpperCase()}
                      </div>
                      
                      {/* Selector de estado para administradores */}
                      {currentUser && currentUser.role === 'admin' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">Cambiar estado:</span>
                          <select
                            value={selectedDenuncia.estado}
                            onChange={(e) => handleEstadoChange(selectedDenuncia.id!, e.target.value as 'pendiente' | 'en_proceso' | 'resuelta' | 'rechazada')}
                            disabled={updatingEstado}
                            className="text-xs px-2 py-1 bg-zinc-700/50 border border-zinc-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="resuelta">Resuelta</option>
                            <option value="rechazada">Rechazada</option>
                          </select>
                          {updatingEstado && (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      )}
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
                    {selectedDenuncia.anonima ? (
                      <p className="text-white">Anónimo</p>
                    ) : (
                      <div className="space-y-1">
                        {loadingDenunciante ? (
                          <div className="bg-gradient-to-r from-zinc-700/40 to-zinc-600/40 p-4 rounded-xl border border-zinc-600/50 animate-pulse">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-zinc-600/50 rounded-full"></div>
                              <div className="space-y-2 flex-1">
                                <div className="h-4 bg-zinc-600/50 rounded w-32"></div>
                                <div className="h-3 bg-zinc-600/50 rounded w-40"></div>
                              </div>
                            </div>
                          </div>
                        ) : denuncianteInfo ? (
                          <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-4 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-white font-semibold text-base mb-2">
                                  {denuncianteInfo.name} {denuncianteInfo.lastname}
                                </h5>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                    <span className="text-blue-200">{denuncianteInfo.email}</span>
                                  </div>
                                  {denuncianteInfo.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                      <span className="text-blue-200">{denuncianteInfo.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 p-3 rounded-lg border border-amber-500/30">
                            <p className="text-amber-200 text-sm">Usuario registrado (información no disponible)</p>
                          </div>
                        )}
                      </div>
                    )}
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
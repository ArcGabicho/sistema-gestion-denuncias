'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Phone,
  Mail,
  Search, 
  Filter,
  Heart,
  MessageCircle,
  Share,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
  X as XIcon,
  Image as ImageIcon,
  Video,
  FileText,
  Headphones,
  Send,
  Eye,
  Scale,
  Shield,
  Users,
  Building2,
  Gavel,
  HelpCircle
} from 'lucide-react';
import { DenunciaPublica, Evidencia } from '../interfaces/DenunciaPublica';
import denunciaService from '../services/denunciaService';
import toast from 'react-hot-toast';

const Portal = () => {
  const [denuncias, setDenuncias] = useState<DenunciaPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [denunciaExpandida, setDenunciaExpandida] = useState<string | null>(null);
  const [mostrandoContacto, setMostrandoContacto] = useState<string | null>(null);
  const [comentarioTexto, setComentarioTexto] = useState<Record<string, string>>({});
  const [mostrandoComentarios, setMostrandoComentarios] = useState<string | null>(null);

  // Generar ID único para usuario (simulado)
  const usuarioId = `usuario_${Math.random().toString(36).substr(2, 9)}`;

  // Cargar denuncias al montar el componente
  useEffect(() => {
    cargarDenuncias();
  }, []);

  const cargarDenuncias = async () => {
    try {
      setLoading(true);
      const denunciasCargadas = await denunciaService.obtenerTodasLasDenuncias();
      setDenuncias(denunciasCargadas);
    } catch (error) {
      console.error('Error cargando denuncias:', error);
      toast.error('Error al cargar las denuncias');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (terminoBusqueda.trim()) {
      try {
        setLoading(true);
        const resultados = await denunciaService.buscarDenuncias(terminoBusqueda);
        setDenuncias(resultados);
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        toast.error('Error en la búsqueda');
      } finally {
        setLoading(false);
      }
    } else {
      cargarDenuncias();
    }
  };

  const handleFiltrarCategoria = async (categoria: string) => {
    setFiltroCategoria(categoria);
    try {
      setLoading(true);
      if (categoria === 'todas') {
        await cargarDenuncias();
      } else {
        const denunciasFiltradas = await denunciaService.obtenerDenunciasPorCategoria(categoria);
        setDenuncias(denunciasFiltradas);
      }
    } catch (error) {
      console.error('Error al filtrar denuncias:', error);
      toast.error('Error al filtrar denuncias');
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colores: Record<string, string> = {
      ruido: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      seguridad: 'bg-red-500/20 text-red-300 border border-red-500/30',
      basura: 'bg-green-500/20 text-green-300 border border-green-500/30',
      transito: 'bg-red-500/20 text-red-300 border border-red-500/30',
      infraestructura: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      servicios: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      vandalismo: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      animales: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
      vecinos: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      emergencia: 'bg-red-600/30 text-red-200 border border-red-600/50',
      otro: 'bg-zinc-600/20 text-zinc-300 border border-zinc-600/30'
    };
    return colores[categoria] || 'bg-zinc-600/20 text-zinc-300 border border-zinc-600/30';
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      ruido: 'Ruido',
      seguridad: 'Seguridad',
      basura: 'Basura',
      transito: 'Tránsito',
      infraestructura: 'Infraestructura',
      servicios: 'Servicios',
      vandalismo: 'Vandalismo',
      animales: 'Animales',
      vecinos: 'Vecinos',
      emergencia: 'Emergencia',
      otro: 'Otro'
    };
    return labels[categoria] || categoria;
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'en_revision': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'resuelto': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'cerrado': return <XIcon className="w-4 h-4 text-zinc-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getEvidenciaIcon = (tipo: string) => {
    switch (tipo) {
      case 'imagen': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'documento': return <FileText className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatearFecha = (fecha: string | Date) => {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const ahora = new Date();
    const diferencia = ahora.getTime() - fechaObj.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    return fechaObj.toLocaleDateString();
  };

  const toggleExpansion = (denunciaId: string) => {
    setDenunciaExpandida(denunciaExpandida === denunciaId ? null : denunciaId);
  };

  const toggleContacto = (denunciaId: string) => {
    setMostrandoContacto(mostrandoContacto === denunciaId ? null : denunciaId);
  };

  const handleMeImporta = async (denunciaId: string) => {
    try {
      const yaDioMeImporta = await denunciaService.toggleMeImporta(denunciaId, usuarioId);
      toast.success(yaDioMeImporta ? 'Te importa esta denuncia' : 'Ya no te importa esta denuncia');
      // Recargar denuncias para actualizar el estado
      await cargarDenuncias();
    } catch (error) {
      console.error('Error en me importa:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleCompartir = async (denuncia: DenunciaPublica) => {
    try {
      const url = window.location.href;
      const texto = `${denuncia.titulo} - ${denuncia.descripcion.substring(0, 100)}...`;
      
      if (navigator.share) {
        await navigator.share({
          title: denuncia.titulo,
          text: texto,
          url: url
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(`${texto}\n${url}`);
        toast.success('Enlace copiado al portapapeles');
      }
      
      // Incrementar contador
      await denunciaService.incrementarCompartido(denuncia.id!);
      await cargarDenuncias();
    } catch (error) {
      console.error('Error compartiendo:', error);
      toast.error('Error al compartir');
    }
  };

  const handleEnviarComentario = async (denunciaId: string) => {
    const texto = comentarioTexto[denunciaId]?.trim();
    if (!texto) return;

    try {
      await denunciaService.agregarComentario(denunciaId, texto, 'Usuario Portal', false);
      setComentarioTexto({ ...comentarioTexto, [denunciaId]: '' });
      toast.success('Comentario agregado');
      await cargarDenuncias();
    } catch (error) {
      console.error('Error agregando comentario:', error);
      toast.error('Error al agregar comentario');
    }
  };

  const toggleComentarios = (denunciaId: string) => {
    setMostrandoComentarios(mostrandoComentarios === denunciaId ? null : denunciaId);
  };

  const categorias = [
    'todas', 'ruido', 'seguridad', 'basura', 'transito', 
    'infraestructura', 'servicios', 'vandalismo', 'animales', 
    'vecinos', 'emergencia', 'otro'
  ];

  return (
    <div className="h-screen bg-zinc-900 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Panel lateral izquierdo - API de Integración */}
        <div className="hidden lg:block w-[28rem] bg-zinc-800 border-r border-zinc-700 flex-shrink-0">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-red-400" />
                  API de Integración
                </h2>
                <p className="text-zinc-400 text-sm">
                  Conecta con sistemas de justicia y seguridad
                </p>
              </div>

              {/* Perú Seguro Integration */}
              <div className="p-6 bg-gradient-to-br from-red-900/50 to-zinc-800 rounded-lg border border-red-700/50">
                <div className="flex items-center mb-4">
                  <Shield className="h-8 w-8 text-red-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Perú Seguro</h3>
                    <p className="text-red-300 text-sm">Sistema de Inteligencia Ciudadanas</p>
                  </div>
                </div>
                
                <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                  Integra las denuncias públicas de <span className="font-semibold text-red-300">Perú Seguro</span> en tu sistema para apoyar a las víctimas y lograr justicia. 
                  Conecta directamente con la base de datos nacional para un seguimiento efectivo.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Users className="h-4 w-4 mr-2 text-green-400" />
                    Apoyo directo a víctimas
                  </div>
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Scale className="h-4 w-4 mr-2 text-yellow-400" />
                    Seguimiento judicial
                  </div>
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Gavel className="h-4 w-4 mr-2 text-red-400" />
                    Garantía de justicia
                  </div>
                </div>

                <Link href={'https://wa.me/923427564?text=Hola,%20quiero%20integrar%20las%20denuncias%20de%20Perú%20Seguro'} target='_blank' className="w-full mt-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Integrar con Perú Seguro
                </Link>

                <div className="mt-4 p-3 bg-zinc-700/50 rounded border border-zinc-600">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">
                    ¿Eres una organización aliada?
                  </h4>
                  <p className="text-xs text-zinc-400 mb-3">
                    Únete a nuestra red y accede a la API para ayudar a más personas.
                  </p>
                  <Link href={'https://wa.me/923427564?text=Hola,%20quiero%20solicitar%20acceso%20a%20la%20API%20de%20Perú%20Seguro%20para%20integrar%20sus%20denuncias%20en%20mi%20sistema.'} target='_blank' className="w-full bg-zinc-600 hover:bg-zinc-700 text-white py-2 px-3 rounded text-xs flex items-center justify-center transition-colors">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Solicitar Acceso API
                  </Link>
                </div>

                {/* Botón para volver al inicio */}
                <div className="mt-6 pt-4 border-t border-zinc-600">
                  <Link
                    href="/"
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 border border-zinc-600 hover:border-zinc-500"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Volver al Inicio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Header fijo */}
          <div className="bg-zinc-800/95 backdrop-blur-sm shadow-xl border-b border-zinc-700/50 flex-shrink-0">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Portal de Denuncias</h1>
                  <p className="text-zinc-400">Mantente informado sobre lo que pasa en tu comunidad</p>
                </div>
                <div className="text-sm text-zinc-400">
                  {denuncias.length} {denuncias.length === 1 ? 'denuncia' : 'denuncias'}
                </div>
              </div>

              {/* Búsqueda y filtros */}
              <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleBuscar} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar denuncias..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-zinc-400"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-zinc-400" />
              <select
                value={filtroCategoria}
                onChange={(e) => handleFiltrarCategoria(e.target.value)}
                className="px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
              >
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria} className="bg-zinc-700 text-white">
                    {categoria === 'todas' ? 'Todas las categorías' : getCategoriaLabel(categoria)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

          {/* Contenedor scrollable de denuncias */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50 animate-pulse">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-zinc-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-zinc-700 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-zinc-700 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-zinc-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : denuncias.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No se encontraron denuncias</h3>
                  <p className="text-zinc-400">
                    {terminoBusqueda ? 'Intenta con otros términos de búsqueda' : 'Aún no hay denuncias públicas'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
            <AnimatePresence>
              {denuncias.map((denuncia) => (
                <motion.div
                  key={denuncia.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-zinc-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-zinc-700/50 hover:shadow-xl hover:border-zinc-600/50 transition-all duration-200"
                >
                  <div className="p-6">
                    {/* Header del post */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {denuncia.denunciante.anonimo ? 'A' : denuncia.denunciante.nombre.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {denuncia.denunciante.anonimo ? 'Usuario Anónimo' : 
                             `${denuncia.denunciante.nombre} ${denuncia.denunciante.apellido}`}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-zinc-400">
                            <span>{formatearFecha(denuncia.fechaCreacion)}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {getEstadoIcon(denuncia.estado)}
                              <span className="capitalize">{denuncia.estado.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoriaColor(denuncia.categoria)}`}>
                        {getCategoriaLabel(denuncia.categoria)}
                      </span>
                    </div>

                    {/* Contenido del post */}
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-white mb-2">{denuncia.titulo}</h2>
                      <p className="text-zinc-300 leading-relaxed">
                        {denunciaExpandida === denuncia.id || denuncia.descripcion.length <= 200
                          ? denuncia.descripcion
                          : `${denuncia.descripcion.substring(0, 200)}...`}
                      </p>
                      {denuncia.descripcion.length > 200 && (
                        <button
                          onClick={() => toggleExpansion(denuncia.id!)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium mt-1"
                        >
                          {denunciaExpandida === denuncia.id ? 'Ver menos' : 'Ver más'}
                        </button>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-4">
                      {denuncia.ubicacion && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{denuncia.ubicacion}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Incidente: {new Date(denuncia.fechaIncidente).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Evidencias */}
                    {denuncia.evidencias && denuncia.evidencias.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-zinc-300">Evidencias:</span>
                          <span className="text-xs text-zinc-500">({denuncia.evidencias.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {denuncia.evidencias.map((evidencia: Evidencia, index: number) => (
                            <a
                              key={index}
                              href={evidencia.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg border border-zinc-600/50 transition-colors duration-200"
                            >
                              {getEvidenciaIcon(evidencia.tipo)}
                              <span className="text-sm text-zinc-300">
                                {evidencia.nombre || `Evidencia ${index + 1}`}
                              </span>
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acciones del post */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
                      <div className="flex items-center space-x-6">
                        <button 
                          onClick={() => handleMeImporta(denuncia.id!)}
                          className={`flex items-center space-x-2 transition-colors duration-200 ${
                            denuncia.interacciones?.meImporta?.includes(usuarioId)
                              ? 'text-red-400' 
                              : 'text-zinc-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${
                            denuncia.interacciones?.meImporta?.includes(usuarioId) ? 'fill-current' : ''
                          }`} />
                          <span className="text-sm">
                            {denuncia.interacciones?.meImporta?.length || 0} Me importa
                          </span>
                        </button>
                        
                        <button 
                          onClick={() => toggleComentarios(denuncia.id!)}
                          className="flex items-center space-x-2 text-zinc-400 hover:text-red-400 transition-colors duration-200"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">
                            {denuncia.interacciones?.comentarios?.length || 0} Comentarios
                          </span>
                        </button>
                        
                        <button 
                          onClick={() => handleCompartir(denuncia)}
                          className="flex items-center space-x-2 text-zinc-400 hover:text-green-400 transition-colors duration-200"
                        >
                          <Share className="w-5 h-5" />
                          <span className="text-sm">
                            {denuncia.interacciones?.compartido || 0} Compartir
                          </span>
                        </button>
                      </div>
                      
                      {!denuncia.denunciante.anonimo && (
                        <button
                          onClick={() => toggleContacto(denuncia.id!)}
                          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-300 transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">Ver contacto</span>
                        </button>
                      )}
                    </div>

                    {/* Información de contacto */}
                    {mostrandoContacto === denuncia.id && !denuncia.denunciante.anonimo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50"
                      >
                        <h4 className="text-sm font-medium text-zinc-300 mb-3">Información de contacto:</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Mail className="w-4 h-4" />
                            <span>{denuncia.denunciante.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Phone className="w-4 h-4" />
                            <span>{denuncia.denunciante.telefono}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Sección de comentarios */}
                    {mostrandoComentarios === denuncia.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 border-t border-zinc-700/50 pt-4"
                      >
                        {/* Lista de comentarios */}
                        {denuncia.interacciones?.comentarios && denuncia.interacciones.comentarios.length > 0 && (
                          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                            {denuncia.interacciones.comentarios.map((comentario, index) => (
                              <div key={index} className="flex space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-xs">
                                    {comentario.anonimo ? 'A' : comentario.autor.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="bg-zinc-700/30 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-zinc-300">
                                        {comentario.autor}
                                      </span>
                                      <span className="text-xs text-zinc-500">
                                        {formatearFecha(comentario.fecha)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-zinc-400">{comentario.contenido}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulario para nuevo comentario */}
                        <div className="flex space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">U</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Escribe un comentario..."
                                value={comentarioTexto[denuncia.id!] || ''}
                                onChange={(e) => setComentarioTexto({
                                  ...comentarioTexto,
                                  [denuncia.id!]: e.target.value
                                })}
                                className="flex-1 px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEnviarComentario(denuncia.id!);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleEnviarComentario(denuncia.id!)}
                                disabled={!comentarioTexto[denuncia.id!]?.trim()}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
            </div>
          </div>

          {/* Botón flotante para crear denuncia */}
          <motion.div
            className="fixed bottom-6 right-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <a
              href="/denuncia"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="hidden sm:block font-medium">Nueva Denuncia</span>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Portal;
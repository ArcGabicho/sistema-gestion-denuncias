"use client";

import { use, useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Phone,
  Clock,
  AlertTriangle,
  Video,
  Image,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { db } from "../../../firebase/firebase.config";

interface Denuncia {
  id: number;
  title: string;
  description: string;
  crimeType: string;
  date: string;
  location: string;
  status: string;
  whatsapp?: string;
  evidenceUrl?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timestamp?: any;
  firestoreId?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const DenunciaDetalle = ({ params }: PageProps) => {
  const { id } = use(params); // <-- Cambia aquí

  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchDenuncia = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "denuncias", id); // <-- Usa id aquí
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setDenuncia({
            id: data.id ?? snap.id,
            title: data.title ?? "",
            description: data.description ?? "",
            crimeType: data.crimeType ?? "",
            date: data.date ?? "",
            location: data.location ?? "",
            status: data.status ?? "",
            whatsapp: data.whatsapp,
            evidenceUrl: data.evidenceUrl,
            timestamp: data.timestamp,
            firestoreId: snap.id,
          });
        } else {
          setError("Denuncia no encontrada");
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Error al cargar la denuncia");
      } finally {
        setLoading(false);
      }
    };
    fetchDenuncia();
  }, [id]);

  // Función para actualizar el estado en Firestore
  const updateEstado = async (nuevoEstado: string) => {
    if (!denuncia) return;
    
    setIsUpdatingStatus(true);
    try {
      const ref = doc(db, "denuncias", id);
      await updateDoc(ref, {
        status: nuevoEstado
      });
      
      // Actualizar el estado local
      setDenuncia({
        ...denuncia,
        status: nuevoEstado
      });
    } catch (err) {
      console.error("Error al actualizar el estado:", err);
      setError("Error al actualizar el estado de la denuncia");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Función para normalizar el estado
  const normalizeEstado = (estado: string) => {
    if (!estado) return "Pendiente";
    const e = estado.trim().toLowerCase();
    if (e === "pendiente") return "Pendiente";
    if (e === "en proceso" || e === "en_proceso" || e === "enproceso")
      return "En proceso";
    if (e === "resuelto") return "Resuelto";
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    const estadoNorm = normalizeEstado(estado);
    if (estadoNorm === "Pendiente") return "bg-yellow-600";
    if (estadoNorm === "En proceso") return "bg-blue-600";
    if (estadoNorm === "Resuelto") return "bg-green-600";
    return "bg-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-white text-lg font-medium">
              Cargando denuncia...
            </p>
            <p className="text-zinc-400 text-sm">
              Obteniendo información del sistema
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !denuncia) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Denuncia no encontrada
          </h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            {error ||
              "No se pudo encontrar la denuncia solicitada en el sistema."}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-black to-zinc-900/90 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-all duration-200 hover:translate-x-1 group"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Volver al dashboard</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  Denuncia #{denuncia.id}
                </h1>
              </div>
              <p className="text-xl text-zinc-300 font-medium leading-relaxed max-w-2xl">
                {denuncia.title}
              </p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-3">
              <select
                value={denuncia.status}
                onChange={(e) => updateEstado(e.target.value)}
                disabled={isUpdatingStatus}
                className={`px-6 py-3 rounded-full text-sm font-semibold text-white shadow-lg ${getEstadoColor(
                  denuncia.status
                )} border-2 border-white/20 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="pendiente" className="bg-zinc-800 text-white">Pendiente</option>
                <option value="en proceso" className="bg-zinc-800 text-white">En proceso</option>
                <option value="resuelto" className="bg-zinc-800 text-white">Resuelto</option>
              </select>
              {isUpdatingStatus && (
                <div className="text-xs text-zinc-400 animate-pulse">
                  Actualizando estado...
                </div>
              )}
              <div className="text-sm text-zinc-400">
                ID: {denuncia.firestoreId?.slice(0, 8)}...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Información principal */}
          <div className="xl:col-span-2 space-y-8">
            {/* Descripción */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700/50 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  Descripción del incidente
                </span>
              </h2>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/30">
                <p className="text-zinc-200 leading-relaxed text-lg">
                  {denuncia.description}
                </p>
              </div>
            </div>

            {/* Evidencia */}
            {denuncia.evidenceUrl && (
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700/50 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2">
                    {denuncia.evidenceUrl.includes(".mp4") ||
                    denuncia.evidenceUrl.includes("video") ? (
                      <Video className="w-6 h-6 text-blue-400" />
                    ) : denuncia.evidenceUrl.includes(".jpg") ||
                      denuncia.evidenceUrl.includes(".png") ||
                      denuncia.evidenceUrl.includes(".jpeg") ||
                      denuncia.evidenceUrl.includes("image") ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image className="w-6 h-6 text-blue-400" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    Evidencia adjunta
                  </span>
                </h2>
                <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/30">
                  {/* Detectar tipo de archivo por URL o extensión */}
                  {denuncia.evidenceUrl.includes(".mp4") ||
                  denuncia.evidenceUrl.includes("video") ? (
                    <video
                      controls
                      className="w-full max-h-96 rounded-xl shadow-lg border border-zinc-600/30"
                    >
                      <source src={denuncia.evidenceUrl} />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  ) : denuncia.evidenceUrl.includes(".jpg") ||
                    denuncia.evidenceUrl.includes(".png") ||
                    denuncia.evidenceUrl.includes(".jpeg") ||
                    denuncia.evidenceUrl.includes("image") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={denuncia.evidenceUrl}
                      alt="Evidencia"
                      className="w-full max-h-96 object-contain rounded-xl shadow-lg border border-zinc-600/30"
                    />
                  ) : (
                    <a
                      href={denuncia.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-all duration-200 bg-blue-500/10 hover:bg-blue-500/20 px-6 py-4 rounded-xl border border-blue-500/20 hover:border-blue-500/40 group"
                    >
                      <FileText className="w-6 h-6" />
                      <span className="font-medium">Ver documento adjunto</span>
                      <ExternalLink className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Información lateral */}
          <div className="space-y-8">
            {/* Detalles */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700/50 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2">
                  <AlertTriangle className="w-6 h-6 text-green-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  Información del caso
                </span>
              </h2>
              <div className="space-y-6">
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500/20 rounded-lg p-2 mt-1">
                      <Calendar className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-400 mb-1">
                        Fecha del incidente
                      </p>
                      <p className="text-white font-semibold text-lg">
                        {denuncia.date}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-500/20 rounded-lg p-2 mt-1">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-400 mb-1">
                        Tipo de delito
                      </p>
                      <p className="text-white font-semibold text-lg">
                        {denuncia.crimeType}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/20 rounded-lg p-2 mt-1">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-400 mb-1">
                        Ubicación
                      </p>
                      <p className="text-white font-semibold text-lg break-words">
                        {denuncia.location}
                      </p>
                    </div>
                  </div>
                </div>

                {denuncia.whatsapp && (
                  <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-500/20 rounded-lg p-2 mt-1">
                        <Phone className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-400 mb-1">
                          Contacto WhatsApp
                        </p>
                        <a
                          href={`https://wa.me/${denuncia.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 transition-colors font-semibold text-lg"
                        >
                          {denuncia.whatsapp}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {denuncia.timestamp && (
                  <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-500/20 rounded-lg p-2 mt-1">
                        <Clock className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-400 mb-1">
                          Fecha de registro
                        </p>
                        <p className="text-white font-semibold text-lg">
                          {new Date(
                            denuncia.timestamp.toDate()
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700/50 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2">
                  <Phone className="w-6 h-6 text-purple-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  Acciones disponibles
                </span>
              </h2>
              <div className="space-y-4">
                {denuncia.whatsapp && (
                <a
                    href={`https://wa.me/${denuncia.whatsapp}?text=${encodeURIComponent(
                        `Hola! Consulta sobre denuncia #${denuncia.id}: "${denuncia.title}". Estado: ${normalizeEstado(denuncia.status)}. ¿Podrían darme información del seguimiento? Gracias.`
                    )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                    >
                    <Phone className="w-5 h-5" />
                    <span className="whitespace-nowrap">Contactar por WhatsApp</span>
                </a>
                )}

                <Link
                  href="/dashboard"
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver al dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DenunciaDetalle;

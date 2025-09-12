import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll 
} from "firebase/storage";
import { db, storage } from "@/app/utils/firebase";
import { DenunciaPublica, Evidencia } from "@/app/interfaces/DenunciaPublica";

// Colección de denuncias públicas
const DENUNCIAS_COLLECTION = "denuncias_publicas";

/**
 * Sube un archivo a Firebase Storage en la carpeta específica de la denuncia
 */
export const subirEvidencia = async (
  denunciaId: string,
  archivo: File,
  nombreArchivo?: string
): Promise<Evidencia> => {
  try {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = archivo.name.split('.').pop();
    const nombre = nombreArchivo || `evidencia_${timestamp}`;
    const nombreCompleto = `${nombre}.${extension}`;
    
    // Crear referencia en Storage: denuncias/{denunciaId}/evidencias/{archivo}
    const storageRef = ref(storage, `denuncias/${denunciaId}/evidencias/${nombreCompleto}`);
    
    // Subir archivo
    const snapshot = await uploadBytes(storageRef, archivo);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Determinar tipo de archivo
    const mimeType = archivo.type;
    let tipo: Evidencia['tipo'] = "otro";
    
    if (mimeType.startsWith('image/')) {
      tipo = "imagen";
    } else if (mimeType.startsWith('video/')) {
      tipo = "video";
    } else if (mimeType.startsWith('audio/')) {
      tipo = "audio";
    } else if (
      mimeType.includes('pdf') || 
      mimeType.includes('document') || 
      mimeType.includes('text')
    ) {
      tipo = "documento";
    }
    
    const evidencia: Evidencia = {
      tipo,
      url: downloadURL,
      nombre: nombreCompleto,
      extension: extension || ""
    };
    
    return evidencia;
  } catch (error) {
    console.error("Error subiendo evidencia:", error);
    throw new Error("Error al subir la evidencia");
  }
};

/**
 * Sube múltiples archivos como evidencias
 */
export const subirMultiplesEvidencias = async (
  denunciaId: string,
  archivos: File[]
): Promise<Evidencia[]> => {
  const evidencias: Evidencia[] = [];
  
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    try {
      const evidencia = await subirEvidencia(denunciaId, archivo, `evidencia_${i + 1}`);
      evidencias.push(evidencia);
    } catch (error) {
      console.error(`Error subiendo archivo ${archivo.name}:`, error);
      // Continuar con los otros archivos aunque uno falle
    }
  }
  
  return evidencias;
};

/**
 * Elimina una evidencia del Storage
 */
export const eliminarEvidencia = async (denunciaId: string, nombreArchivo: string): Promise<void> => {
  try {
    const storageRef = ref(storage, `denuncias/${denunciaId}/evidencias/${nombreArchivo}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error eliminando evidencia:", error);
    throw new Error("Error al eliminar la evidencia");
  }
};

/**
 * Elimina todas las evidencias de una denuncia
 */
export const eliminarTodasLasEvidencias = async (denunciaId: string): Promise<void> => {
  try {
    const evidenciasRef = ref(storage, `denuncias/${denunciaId}/evidencias`);
    const evidenciasList = await listAll(evidenciasRef);
    
    // Eliminar todos los archivos
    const deletePromises = evidenciasList.items.map(item => deleteObject(item));
    await Promise.all(deletePromises);
    
    // Intentar eliminar la carpeta (puede fallar si hay subcarpetas)
    try {
      await deleteObject(ref(storage, `denuncias/${denunciaId}`));
    } catch (error) {
      // La carpeta puede no estar vacía, esto es normal
      console.log("Carpeta de denuncia no eliminada (puede contener otros archivos)", error);
    }
  } catch (error) {
    console.error("Error eliminando evidencias:", error);
    throw new Error("Error al eliminar las evidencias");
  }
};

/**
 * Crea una nueva denuncia pública en Firestore
 */
export const crearDenunciaPublica = async (denuncia: Omit<DenunciaPublica, 'id' | 'fechaCreacion'>): Promise<string> => {
  try {
    // Preparar datos para Firestore
    const denunciaData = {
      ...denuncia,
      fechaCreacion: serverTimestamp(),
      fechaIncidente: typeof denuncia.fechaIncidente === 'string' 
        ? Timestamp.fromDate(new Date(denuncia.fechaIncidente))
        : Timestamp.fromDate(new Date()),
      estado: denuncia.estado || "pendiente",
      // Asegurar que las evidencias (URLs) se guarden correctamente
      evidencias: denuncia.evidencias || []
    };
    
    // Agregar documento a Firestore
    const docRef = await addDoc(collection(db, DENUNCIAS_COLLECTION), denunciaData);
    
    console.log("Denuncia creada con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creando denuncia:", error);
    throw new Error("Error al crear la denuncia");
  }
};

/**
 * Crea una denuncia completa con evidencias (archivos y URLs)
 */
export const crearDenunciaConEvidencias = async (
  denuncia: Omit<DenunciaPublica, 'id' | 'fechaCreacion'>,
  archivosEvidencias?: File[]
): Promise<string> => {
  try {
    // Evidencias que vienen como URLs del formulario
    const evidenciasURL = denuncia.evidencias || [];
    
    // Si hay archivos físicos, subirlos primero
    let evidenciasArchivos: Evidencia[] = [];
    if (archivosEvidencias && archivosEvidencias.length > 0) {
      // Crear la denuncia primero para obtener el ID
      const denunciaTemp = { ...denuncia, evidencias: evidenciasURL };
      const denunciaId = await crearDenunciaPublica(denunciaTemp);
      
      // Subir archivos físicos a Storage
      evidenciasArchivos = await subirMultiplesEvidencias(denunciaId, archivosEvidencias);
      
      // Combinar evidencias URL + archivos subidos
      const todasLasEvidencias = [...evidenciasURL, ...evidenciasArchivos];
      
      // Actualizar la denuncia con todas las evidencias
      await actualizarDenuncia(denunciaId, { evidencias: todasLasEvidencias });
      
      return denunciaId;
    } else {
      // Solo hay evidencias por URL, crear denuncia directamente
      return await crearDenunciaPublica(denuncia);
    }
  } catch (error) {
    console.error("Error creando denuncia con evidencias:", error);
    throw new Error("Error al crear la denuncia con evidencias");
  }
};

/**
 * Obtiene una denuncia por su ID
 */
export const obtenerDenuncia = async (id: string): Promise<DenunciaPublica | null> => {
  try {
    const docRef = doc(db, DENUNCIAS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || data.fechaCreacion,
        fechaIncidente: data.fechaIncidente?.toDate?.()?.toISOString().split('T')[0] || data.fechaIncidente
      } as DenunciaPublica;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error obteniendo denuncia:", error);
    throw new Error("Error al obtener la denuncia");
  }
};

/**
 * Obtiene todas las denuncias públicas
 */
export const obtenerTodasLasDenuncias = async (limite?: number): Promise<DenunciaPublica[]> => {
  try {
    let q = query(
      collection(db, DENUNCIAS_COLLECTION),
      orderBy("fechaCreacion", "desc")
    );
    
    if (limite) {
      q = query(q, limit(limite));
    }
    
    const querySnapshot = await getDocs(q);
    const denuncias: DenunciaPublica[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      denuncias.push({
        id: doc.id,
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || data.fechaCreacion,
        fechaIncidente: data.fechaIncidente?.toDate?.()?.toISOString().split('T')[0] || data.fechaIncidente
      } as DenunciaPublica);
    });
    
    return denuncias;
  } catch (error) {
    console.error("Error obteniendo denuncias:", error);
    throw new Error("Error al obtener las denuncias");
  }
};

/**
 * Obtiene denuncias filtradas por categoría
 */
export const obtenerDenunciasPorCategoria = async (categoria: string): Promise<DenunciaPublica[]> => {
  try {
    const q = query(
      collection(db, DENUNCIAS_COLLECTION),
      where("categoria", "==", categoria),
      orderBy("fechaCreacion", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const denuncias: DenunciaPublica[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      denuncias.push({
        id: doc.id,
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || data.fechaCreacion,
        fechaIncidente: data.fechaIncidente?.toDate?.()?.toISOString().split('T')[0] || data.fechaIncidente
      } as DenunciaPublica);
    });
    
    return denuncias;
  } catch (error) {
    console.error("Error obteniendo denuncias por categoría:", error);
    throw new Error("Error al obtener las denuncias por categoría");
  }
};

/**
 * Obtiene denuncias filtradas por estado
 */
export const obtenerDenunciasPorEstado = async (estado: DenunciaPublica['estado']): Promise<DenunciaPublica[]> => {
  try {
    const q = query(
      collection(db, DENUNCIAS_COLLECTION),
      where("estado", "==", estado),
      orderBy("fechaCreacion", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const denuncias: DenunciaPublica[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      denuncias.push({
        id: doc.id,
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() || data.fechaCreacion,
        fechaIncidente: data.fechaIncidente?.toDate?.()?.toISOString().split('T')[0] || data.fechaIncidente
      } as DenunciaPublica);
    });
    
    return denuncias;
  } catch (error) {
    console.error("Error obteniendo denuncias por estado:", error);
    throw new Error("Error al obtener las denuncias por estado");
  }
};

/**
 * Actualiza una denuncia existente
 */
export const actualizarDenuncia = async (
  id: string, 
  actualizaciones: Partial<Omit<DenunciaPublica, 'id' | 'fechaCreacion'>>
): Promise<void> => {
  try {
    const docRef = doc(db, DENUNCIAS_COLLECTION, id);
    
    // Convertir fechas si es necesario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datosActualizacion: Record<string, any> = { ...actualizaciones };
    
    if (actualizaciones.fechaIncidente) {
      datosActualizacion.fechaIncidente = typeof actualizaciones.fechaIncidente === 'string'
        ? Timestamp.fromDate(new Date(actualizaciones.fechaIncidente))
        : actualizaciones.fechaIncidente;
    }
    
    await updateDoc(docRef, datosActualizacion);
    console.log("Denuncia actualizada:", id);
  } catch (error) {
    console.error("Error actualizando denuncia:", error);
    throw new Error("Error al actualizar la denuncia");
  }
};

/**
 * Cambia el estado de una denuncia
 */
export const cambiarEstadoDenuncia = async (
  id: string, 
  nuevoEstado: DenunciaPublica['estado']
): Promise<void> => {
  try {
    await actualizarDenuncia(id, { estado: nuevoEstado });
    console.log(`Estado de denuncia ${id} cambiado a: ${nuevoEstado}`);
  } catch (error) {
    console.error("Error cambiando estado de denuncia:", error);
    throw new Error("Error al cambiar el estado de la denuncia");
  }
};

/**
 * Elimina una denuncia y todas sus evidencias
 */
export const eliminarDenuncia = async (id: string): Promise<void> => {
  try {
    // Primero eliminar todas las evidencias del Storage
    await eliminarTodasLasEvidencias(id);
    
    // Luego eliminar el documento de Firestore
    const docRef = doc(db, DENUNCIAS_COLLECTION, id);
    await deleteDoc(docRef);
    
    console.log("Denuncia eliminada:", id);
  } catch (error) {
    console.error("Error eliminando denuncia:", error);
    throw new Error("Error al eliminar la denuncia");
  }
};

/**
 * Busca denuncias por texto en título o descripción
 */
export const buscarDenuncias = async (textoBusqueda: string): Promise<DenunciaPublica[]> => {
  try {
    // Nota: Firestore no tiene búsqueda de texto completo nativa
    // Esta es una implementación básica que busca coincidencias exactas
    const todasLasDenuncias = await obtenerTodasLasDenuncias();
    
    const textoBusquedaLower = textoBusqueda.toLowerCase();
    
    const denunciasFiltradas = todasLasDenuncias.filter(denuncia => 
      denuncia.titulo.toLowerCase().includes(textoBusquedaLower) ||
      denuncia.descripcion.toLowerCase().includes(textoBusquedaLower) ||
      denuncia.ubicacion?.toLowerCase().includes(textoBusquedaLower)
    );
    
    return denunciasFiltradas;
  } catch (error) {
    console.error("Error buscando denuncias:", error);
    throw new Error("Error al buscar denuncias");
  }
};

/**
 * Obtiene estadísticas básicas de denuncias
 */
export const obtenerEstadisticasDenuncias = async () => {
  try {
    const todasLasDenuncias = await obtenerTodasLasDenuncias();
    
    const estadisticas = {
      total: todasLasDenuncias.length,
      pendientes: todasLasDenuncias.filter(d => d.estado === "pendiente").length,
      enRevision: todasLasDenuncias.filter(d => d.estado === "en_revision").length,
      resueltas: todasLasDenuncias.filter(d => d.estado === "resuelto").length,
      cerradas: todasLasDenuncias.filter(d => d.estado === "cerrado").length,
      porCategoria: {} as Record<string, number>
    };
    
    // Contar por categoría
    todasLasDenuncias.forEach(denuncia => {
      const categoria = denuncia.categoria;
      estadisticas.porCategoria[categoria] = (estadisticas.porCategoria[categoria] || 0) + 1;
    });
    
    return estadisticas;
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    throw new Error("Error al obtener estadísticas de denuncias");
  }
};

/**
 * Agrega o quita "me importa" a una denuncia
 */
export const toggleMeImporta = async (denunciaId: string, usuarioId: string): Promise<boolean> => {
  try {
    const denuncia = await obtenerDenuncia(denunciaId);
    if (!denuncia) throw new Error("Denuncia no encontrada");

    const interacciones = denuncia.interacciones || { meImporta: [], comentarios: [], compartido: 0 };
    const meImportaArray = interacciones.meImporta || [];
    
    let nuevoMeImporta: string[];
    let yaDioMeImporta = false;
    
    if (meImportaArray.includes(usuarioId)) {
      // Quitar "me importa"
      nuevoMeImporta = meImportaArray.filter(id => id !== usuarioId);
      yaDioMeImporta = false;
    } else {
      // Agregar "me importa"
      nuevoMeImporta = [...meImportaArray, usuarioId];
      yaDioMeImporta = true;
    }

    await actualizarDenuncia(denunciaId, {
      interacciones: {
        ...interacciones,
        meImporta: nuevoMeImporta
      }
    });

    return yaDioMeImporta;
  } catch (error) {
    console.error("Error toggling me importa:", error);
    throw new Error("Error al actualizar me importa");
  }
};

/**
 * Agrega un comentario a una denuncia
 */
export const agregarComentario = async (
  denunciaId: string, 
  contenido: string, 
  autor: string, 
  anonimo: boolean = false
): Promise<void> => {
  try {
    const denuncia = await obtenerDenuncia(denunciaId);
    if (!denuncia) throw new Error("Denuncia no encontrada");

    const interacciones = denuncia.interacciones || { meImporta: [], comentarios: [], compartido: 0 };
    const comentarios = interacciones.comentarios || [];

    const nuevoComentario = {
      id: `comentario_${Date.now()}`,
      autor: anonimo ? "Anónimo" : autor,
      contenido,
      fecha: new Date().toISOString(),
      anonimo
    };

    await actualizarDenuncia(denunciaId, {
      interacciones: {
        ...interacciones,
        comentarios: [...comentarios, nuevoComentario]
      }
    });

    console.log("Comentario agregado:", nuevoComentario);
  } catch (error) {
    console.error("Error agregando comentario:", error);
    throw new Error("Error al agregar comentario");
  }
};

/**
 * Incrementa el contador de compartido
 */
export const incrementarCompartido = async (denunciaId: string): Promise<void> => {
  try {
    const denuncia = await obtenerDenuncia(denunciaId);
    if (!denuncia) throw new Error("Denuncia no encontrada");

    const interacciones = denuncia.interacciones || { meImporta: [], comentarios: [], compartido: 0 };
    
    await actualizarDenuncia(denunciaId, {
      interacciones: {
        ...interacciones,
        compartido: (interacciones.compartido || 0) + 1
      }
    });

    console.log("Contador de compartido incrementado");
  } catch (error) {
    console.error("Error incrementando compartido:", error);
    throw new Error("Error al actualizar contador de compartido");
  }
};

const denunciaService = {
  // Funciones principales
  crearDenunciaPublica,
  crearDenunciaConEvidencias,
  obtenerDenuncia,
  obtenerTodasLasDenuncias,
  actualizarDenuncia,
  eliminarDenuncia,
  
  // Funciones de evidencias
  subirEvidencia,
  subirMultiplesEvidencias,
  eliminarEvidencia,
  eliminarTodasLasEvidencias,
  
  // Funciones de filtrado
  obtenerDenunciasPorCategoria,
  obtenerDenunciasPorEstado,
  buscarDenuncias,
  
  // Funciones de gestión
  cambiarEstadoDenuncia,
  obtenerEstadisticasDenuncias,
  
  // Funciones de interacciones sociales
  toggleMeImporta,
  agregarComentario,
  incrementarCompartido
};

export default denunciaService;

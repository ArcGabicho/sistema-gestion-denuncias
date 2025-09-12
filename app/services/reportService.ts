import { DenunciaInterna } from '../interfaces/DenunciaInterna';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../utils/firebase';
import { PDFDocument, rgb } from 'pdf-lib';

// Configuración de OpenAI usando fetch directo
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

export interface ReporteLegal {
  id: string;
  denunciaId: string;
  comunidadId: string; // Para segregación por comunidad
  tipo: 'interno' | 'publico';
  titulo: string;
  contenido: string;
  fechaGeneracion: Date;
  recomendaciones: string[];
  fundamentoLegal: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  storageUrl?: string; // URL de Firebase Storage
  fileName?: string; // Nombre del archivo en Storage
  tamaño?: number; // Tamaño del archivo en bytes
}

export interface OpcionesReporte {
  incluirFundamentoLegal: boolean;
  incluirRecomendaciones: boolean;
  incluirAnalisisRiesgo: boolean;
  tipoReporte: 'ejecutivo' | 'detallado' | 'legal';
}

// Función para generar el prompt para denuncias internas
const generarPromptReporte = (
  denuncia: DenunciaInterna, 
  opciones: OpcionesReporte
): string => {
  let prompt = `
Eres un experto en derecho administrativo y comunitario peruano. 
Genera un reporte legal profesional basado en la siguiente denuncia interna comunitaria:

INFORMACIÓN DE LA DENUNCIA:
- Título: ${denuncia.titulo}
- Descripción: ${denuncia.descripcion}
- Tipo: Denuncia Interna Comunitaria
- Categoría: ${denuncia.tipo}
- Estado: ${denuncia.estado}
- Ubicación: ${denuncia.ubicacion || 'No especificada'}
- Fecha: ${denuncia.fechaCreacion.toDate().toLocaleDateString()}
- Es anónima: ${denuncia.anonima ? 'Sí' : 'No'}
`;

  prompt += `

INSTRUCCIONES PARA EL REPORTE:
`;

  switch (opciones.tipoReporte) {
    case 'ejecutivo':
      prompt += `
- Genera un resumen ejecutivo conciso (máximo 500 palabras)
- Enfócate en los puntos clave y recomendaciones inmediatas
- Usa un lenguaje profesional pero accesible
`;
      break;
    case 'detallado':
      prompt += `
- Genera un análisis detallado de la situación
- Incluye contexto, implicaciones y pasos a seguir
- Máximo 1500 palabras
`;
      break;
    case 'legal':
      prompt += `
- Enfócate en los aspectos legales y normativos
- Cita normativas peruanas relevantes cuando sea posible
- Incluye precedentes y jurisprudencia si aplica
`;
      break;
  }

  if (opciones.incluirFundamentoLegal) {
    prompt += `
- OBLIGATORIO: Incluye una sección "FUNDAMENTO LEGAL" con las normativas peruanas aplicables
- Menciona leyes, decretos, ordenanzas municipales relevantes
`;
  }

  if (opciones.incluirRecomendaciones) {
    prompt += `
- OBLIGATORIO: Incluye una sección "RECOMENDACIONES" con acciones específicas
- Propón pasos concretos para resolver la situación
`;
  }

  if (opciones.incluirAnalisisRiesgo) {
    prompt += `
- OBLIGATORIO: Incluye una sección "ANÁLISIS DE RIESGO" evaluando:
  * Riesgo legal para la comunidad/municipio
  * Posibles consecuencias de no actuar
  * Nivel de prioridad (BAJA/MEDIA/ALTA/URGENTE)
`;
  }

  prompt += `

FORMATO DE RESPUESTA:
Estructura el reporte en secciones claras con títulos en mayúsculas.
Usa un lenguaje profesional, claro y directo.
Incluye fecha y lugar cuando sea relevante.
El reporte debe ser útil para autoridades municipales y líderes comunitarios.

CONTEXTO LEGAL PERUANO:
Considera la legislación peruana sobre:
- Ley Orgánica de Municipalidades (Ley 27972)
- Código Civil y normativas sobre convivencia vecinal
- Reglamentos municipales de cada distrito
- Ley de Participación y Control Ciudadanos
`;

  return prompt;
};

// Función para extraer información específica del reporte generado
const procesarRespuestaIA = (respuestaIA: string): {
  contenido: string;
  recomendaciones: string[];
  fundamentoLegal: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
} => {
  let recomendaciones: string[] = [];
  let fundamentoLegal = '';
  let prioridad: 'baja' | 'media' | 'alta' | 'urgente' = 'media';

  // Extraer recomendaciones
  const recomendacionesMatch = respuestaIA.match(/RECOMENDACIONES[:\s]*([\s\S]*?)(?=\n[A-Z]|$)/i);
  if (recomendacionesMatch) {
    const seccionRecomendaciones = recomendacionesMatch[1];
    recomendaciones = seccionRecomendaciones
      .split(/[-•]\s*/)
      .filter(rec => rec.trim().length > 10)
      .map(rec => rec.trim());
  }

  // Extraer fundamento legal
  const fundamentoMatch = respuestaIA.match(/FUNDAMENTO LEGAL[:\s]*([\s\S]*?)(?=\n[A-Z]|$)/i);
  if (fundamentoMatch) {
    fundamentoLegal = fundamentoMatch[1].trim();
  }

  // Extraer prioridad del análisis de riesgo
  const riesgoMatch = respuestaIA.match(/ANÁLISIS DE RIESGO[:\s]*([\s\S]*?)(?=\n[A-Z]|$)/i);
  if (riesgoMatch) {
    const seccionRiesgo = riesgoMatch[1].toLowerCase();
    if (seccionRiesgo.includes('urgente')) prioridad = 'urgente';
    else if (seccionRiesgo.includes('alta')) prioridad = 'alta';
    else if (seccionRiesgo.includes('baja')) prioridad = 'baja';
    else prioridad = 'media';
  }

  return {
    contenido: respuestaIA,
    recomendaciones,
    fundamentoLegal,
    prioridad
  };
};

// Función de fallback para generar reporte básico sin IA
const generarReporteFallback = (
  denuncia: DenunciaInterna, 
  opciones: OpcionesReporte
): string => {
  const fecha = new Date().toLocaleDateString();
  const fechaDenuncia = denuncia.fechaCreacion.toDate().toLocaleDateString();
  
  let reporte = `
REPORTE LEGAL AUTOMÁTICO
========================

INFORMACIÓN GENERAL
------------------
Título de la Denuncia: ${denuncia.titulo}
Tipo: Denuncia Interna Comunitaria
Categoría: ${denuncia.tipo}
Estado Actual: ${denuncia.estado}
Fecha de la Denuncia: ${fechaDenuncia}
Fecha del Reporte: ${fecha}
Denuncia Anónima: ${denuncia.anonima ? 'Sí' : 'No'}
Ubicación: ${denuncia.ubicacion || 'No especificada'}

DESCRIPCIÓN DE LOS HECHOS
-------------------------
${denuncia.descripcion}

ANÁLISIS PRELIMINAR
------------------
La presente denuncia ha sido registrada en el sistema de gestión comunitaria y requiere 
atención de las autoridades competentes. Se recomienda una investigación adecuada 
para determinar las acciones pertinentes.
`;

  if (opciones.incluirRecomendaciones) {
    reporte += `

RECOMENDACIONES
---------------
• Iniciar investigación preliminar de los hechos denunciados
• Contactar a las partes involucradas para obtener más información
• Documentar todas las evidencias disponibles
• Determinar si es necesario involucrar a autoridades municipales
• Establecer un plazo para la resolución del caso
• Mantener informados a los denunciantes sobre el progreso
`;
  }

  if (opciones.incluirFundamentoLegal) {
    reporte += `

FUNDAMENTO LEGAL
----------------
• Ley Orgánica de Municipalidades (Ley N° 27972)
• Código Civil Peruano - Disposiciones sobre convivencia vecinal
• Reglamento Nacional de Edificaciones
• Ordenanzas municipales locales aplicables
• Ley de Participación y Control Ciudadanos (Ley N° 26300)
`;
  }

  if (opciones.incluirAnalisisRiesgo) {
    reporte += `

ANÁLISIS DE RIESGO
------------------
Nivel de Prioridad: MEDIA

Este caso requiere atención oportuna para evitar escalamiento de conflictos.
Se recomienda actuar dentro de los próximos 15 días hábiles para mantener
la armonía comunitaria y cumplir con las obligaciones legales correspondientes.

Riesgos identificados:
• Posible deterioro de las relaciones vecinales
• Incumplimiento de normativas municipales
• Necesidad de intervención de autoridades superiores si no se resuelve
`;
  }

  reporte += `

OBSERVACIONES
-------------
Este reporte fue generado automáticamente debido a problemas de conectividad 
con el sistema de inteligencia artificial. Se recomienda solicitar una revisión 
manual por parte de un asesor legal para complementar este análisis.

---
Generado por: Sistema de Gestión de Denuncias Comunitarias
Modo: Reporte Básico (Sin IA)
Fecha: ${fecha}
`;

  return reporte;
};

// Función para guardar reporte en Firebase Storage y Firestore
const guardarReporteEnFirebase = async (reporte: ReporteLegal): Promise<ReporteLegal> => {
  try {
    console.log(`📝 Iniciando guardado de reporte para comunidad: ${reporte.comunidadId}`);

    // Crear contenido PDF del reporte
    const contenidoPDF = await exportarReporteAPDF(reporte);
    console.log(`📄 PDF generado: ${contenidoPDF.byteLength} bytes`);

    // Generar nombre de archivo único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `reporte_${reporte.comunidadId}_${timestamp}_${reporte.id}.pdf`;
    console.log(`🗂️ Nombre de archivo: ${fileName}`);

    // Crear referencia de Storage con estructura por comunidad
    const storageRef = ref(storage, `reportes/${reporte.comunidadId}/${fileName}`);
    console.log(`☁️ Ruta de Storage: reportes/${reporte.comunidadId}/${fileName}`);

    // Subir archivo a Storage
    console.log(`⬆️ Subiendo archivo a Firebase Storage...`);
    const uploadResult = await uploadBytes(storageRef, contenidoPDF);
    console.log(`✅ Archivo subido exitosamente`);
    
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log(`🔗 URL de descarga obtenida: ${downloadURL.substring(0, 80)}...`);
    
    // Crear reporte actualizado con datos de Storage
    const reporteConStorage: ReporteLegal = {
      ...reporte,
      storageUrl: downloadURL,
      fileName,
      tamaño: contenidoPDF.byteLength
    };
    
    // Guardar metadata en Firestore
    console.log(`💾 Guardando metadata en Firestore...`);
    await setDoc(doc(db, 'reportes_legales', reporte.id), {
      ...reporteConStorage,
      fechaGeneracion: reporte.fechaGeneracion // Firestore timestamp
    });
    
    console.log(`🎉 Reporte guardado completamente en Firebase!`);
    return reporteConStorage;
    
  } catch (error) {
    console.error('❌ Error guardando reporte en Firebase:', error);
    throw new Error(`No se pudo guardar el reporte en la nube: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Función principal para generar reporte legal
export const generarReporteLegal = async (
  denuncia: DenunciaInterna,
  opciones: OpcionesReporte = {
    incluirFundamentoLegal: true,
    incluirRecomendaciones: true,
    incluirAnalisisRiesgo: true,
    tipoReporte: 'detallado'
  },
  comunidadId?: string
): Promise<ReporteLegal> => {
  try {
    // Verificar que existe la API key
    if (!OPENAI_API_KEY) {
      throw new Error('API Key de OpenAI no configurada');
    }

    // Generar el prompt
    const prompt = generarPromptReporte(denuncia, opciones);

    console.log('🤖 Iniciando llamada a IA para generar reporte...');
    
    let respuestaIA = '';
    
    try {
      // Método 1: Usar API route interna (recomendado para evitar CORS)
      console.log('� Intentando método 1: API Route interna...');
      
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        respuestaIA = data.contenido;
        console.log('✅ Reporte generado exitosamente via API Route');
      } else {
        throw new Error(`API Route error: ${response.status}`);
      }
      
    } catch (apiError) {
      console.warn('⚠️ API Route falló, intentando método 2:', apiError);
      
      try {
        // Método 2: Llamada directa a OpenAI (fallback)
        console.log('� Intentando método 2: Llamada directa a OpenAI...');
        
        if (!OPENAI_API_KEY) {
          throw new Error('API Key no configurada');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Eres un experto jurista peruano especializado en derecho administrativo, municipal y comunitario. Generas reportes legales profesionales para autoridades locales."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        respuestaIA = data.choices?.[0]?.message?.content || '';
        
        if (!respuestaIA) {
          throw new Error('Respuesta vacía de OpenAI');
        }
        
        console.log('✅ Reporte generado exitosamente via OpenAI directo');
        
      } catch (openaiError) {
        console.warn('⚠️ OpenAI directo también falló, usando reporte básico:', openaiError);
        
        // Método 3: Reporte básico sin IA (último fallback)
        console.log('🔄 Generando reporte básico como último recurso...');
        respuestaIA = generarReporteFallback(denuncia, opciones);
        console.log('✅ Reporte básico generado correctamente');
      }
    }
    
    // Procesar la respuesta
    const { contenido, recomendaciones, fundamentoLegal, prioridad } = procesarRespuestaIA(respuestaIA);

    // Crear el reporte
    const reporte: ReporteLegal = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      denunciaId: denuncia.id || '',
      comunidadId: comunidadId || denuncia.comunidadId, // Usar parámetro o fallback
      tipo: 'interno',
      titulo: `Reporte Legal: ${denuncia.titulo}`,
      contenido,
      fechaGeneracion: new Date(),
      recomendaciones,
      fundamentoLegal,
      prioridad
    };

    // Guardar reporte en Firebase Storage y Firestore
    const reporteGuardado = await guardarReporteEnFirebase(reporte);

    return reporteGuardado;

  } catch (error) {
    console.error('Error generando reporte legal:', error);
    throw new Error(`No se pudo generar el reporte legal: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Función para exportar reporte a PDF (real)
export const exportarReporteAPDF = async (reporte: ReporteLegal): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  const { height } = page.getSize();
  const fontSize = 12;

  page.drawText(`REPORTE LEGAL - SISTEMA DE GESTIÓN DE DENUNCIAS COMUNITARIAS`, {
    x: 50,
    y: height - 50,
    size: fontSize + 2,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Título: ${reporte.titulo}`, { x: 50, y: height - 80, size: fontSize });
  page.drawText(`Fecha de Generación: ${reporte.fechaGeneracion.toLocaleDateString()}`, { x: 50, y: height - 100, size: fontSize });
  page.drawText(`ID del Reporte: ${reporte.id}`, { x: 50, y: height - 120, size: fontSize });
  page.drawText(`Prioridad: ${reporte.prioridad.toUpperCase()}`, { x: 50, y: height - 140, size: fontSize });

  const contenido = reporte.contenido.split('\n');
  let offsetY = height - 160;

  contenido.forEach((line) => {
    if (offsetY < 50) {
      page.drawText('...continúa en la siguiente página', { x: 50, y: offsetY, size: fontSize });
      offsetY = height - 50;
      page = pdfDoc.addPage([595.28, 841.89]);
    }
    page.drawText(line, { x: 50, y: offsetY, size: fontSize });
    offsetY -= 20;
  });

  return await pdfDoc.save();
};

// Función para cargar reportes de una comunidad desde Firestore
export const cargarReportesPorComunidad = async (comunidadId: string): Promise<ReporteLegal[]> => {
  try {
    if (!comunidadId) {
      console.log('No hay comunidadId, retornando array vacío');
      return [];
    }

    const reportesRef = collection(db, 'reportes_legales');
    
    // Crear query más simple sin orderBy inicialmente
    const q = query(
      reportesRef,
      where('comunidadId', '==', comunidadId)
    );
    
    const querySnapshot = await getDocs(q);
    const reportes: ReporteLegal[] = [];
    
    if (querySnapshot.empty) {
      console.log(`No se encontraron reportes para la comunidad ${comunidadId}`);
      return [];
    }
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const reporte = {
          ...data,
          id: doc.id, // Asegurar que el ID del documento esté incluido
          fechaGeneracion: data.fechaGeneracion?.toDate ? data.fechaGeneracion.toDate() : new Date(data.fechaGeneracion)
        } as ReporteLegal;
        reportes.push(reporte);
      } catch (docError) {
        console.warn(`Error procesando documento ${doc.id}:`, docError);
      }
    });
    
    // Ordenar manualmente por fecha (más seguro)
    reportes.sort((a, b) => b.fechaGeneracion.getTime() - a.fechaGeneracion.getTime());
    
    console.log(`Cargados ${reportes.length} reportes para la comunidad ${comunidadId}`);
    return reportes;
    
  } catch (error) {
    console.error('Error cargando reportes:', error);
    // En lugar de lanzar error, retornar array vacío para no bloquear la UI
    console.log('Retornando array vacío debido a error en la carga');
    return [];
  }
};

// Función para eliminar reporte de Firebase Storage y Firestore
export const eliminarReporteDeFirebase = async (reporte: ReporteLegal): Promise<void> => {
  try {
    // Eliminar archivo de Storage si existe
    if (reporte.fileName && reporte.comunidadId) {
      const storageRef = ref(storage, `reportes/${reporte.comunidadId}/${reporte.fileName}`);
      await deleteObject(storageRef);
    }
    
    // Eliminar documento de Firestore
    await deleteDoc(doc(db, 'reportes_legales', reporte.id));
    
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    throw new Error('No se pudo eliminar el reporte');
  }
};

// Función para descargar reporte desde Firebase Storage
export const descargarReporteDesdeFirebase = async (reporte: ReporteLegal) => {
  if (!reporte.storageUrl) throw new Error("No hay URL de storage para este reporte");
  const fileRef = ref(storage, reporte.storageUrl);
  
  // Obtiene la URL de descarga
  const url = await getDownloadURL(fileRef);

  // Descarga el archivo usando un enlace temporal
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.download = reporte.fileName || `reporte_legal_${reporte.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Función para listar todos los reportes de una comunidad en Storage
export const listarReportesEnStorage = async (comunidadId: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, `reportes/${comunidadId}/`);
    const result = await listAll(storageRef);
    return result.items.map(item => item.name);
  } catch (error) {
    console.error('Error listando reportes en Storage:', error);
    return [];
  }
};

// Función para obtener estadísticas de reportes
export const obtenerEstadisticasReportes = (reportes: ReporteLegal[]) => {
  const stats = {
    total: reportes.length,
    porPrioridad: {
      urgente: reportes.filter(r => r.prioridad === 'urgente').length,
      alta: reportes.filter(r => r.prioridad === 'alta').length,
      media: reportes.filter(r => r.prioridad === 'media').length,
      baja: reportes.filter(r => r.prioridad === 'baja').length,
    },
    porTipo: {
      interno: reportes.filter(r => r.tipo === 'interno').length,
      publico: reportes.filter(r => r.tipo === 'publico').length,
    },
    reportesRecientes: reportes
      .sort((a, b) => b.fechaGeneracion.getTime() - a.fechaGeneracion.getTime())
      .slice(0, 5),
    tamañoTotal: reportes.reduce((total, r) => total + (r.tamaño || 0), 0),
    reportesEnStorage: reportes.filter(r => r.storageUrl).length
  };

  return stats;
};
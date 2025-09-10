import { OpenAI } from 'openai';
import { DenunciaInterna } from '../interfaces/DenunciaInterna';
import { DenunciaPublica } from '../interfaces/DenunciaPublica';

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ReporteLegal {
  id: string;
  denunciaId: string;
  tipo: 'interno' | 'publico';
  titulo: string;
  contenido: string;
  fechaGeneracion: Date;
  recomendaciones: string[];
  fundamentoLegal: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface OpcionesReporte {
  incluirFundamentoLegal: boolean;
  incluirRecomendaciones: boolean;
  incluirAnalisisRiesgo: boolean;
  tipoReporte: 'ejecutivo' | 'detallado' | 'legal';
}

// Función para generar el prompt según el tipo de denuncia
const generarPromptReporte = (
  denuncia: DenunciaInterna | DenunciaPublica, 
  opciones: OpcionesReporte
): string => {
  const esDenunciaInterna = 'tipo' in denuncia && 'comunidadId' in denuncia;
  
  let prompt = `
Eres un experto en derecho administrativo y comunitario peruano. 
Genera un reporte legal profesional basado en la siguiente denuncia:

INFORMACIÓN DE LA DENUNCIA:
- Título: ${denuncia.titulo}
- Descripción: ${denuncia.descripcion}
- Tipo: ${esDenunciaInterna ? 'Denuncia Interna Comunitaria' : 'Denuncia Pública'}
`;

  if (esDenunciaInterna) {
    const denunciaInt = denuncia as DenunciaInterna;
    prompt += `
- Categoría: ${denunciaInt.tipo}
- Estado: ${denunciaInt.estado}
- Ubicación: ${denunciaInt.ubicacion || 'No especificada'}
- Fecha: ${denunciaInt.fechaCreacion.toDate().toLocaleDateString()}
- Es anónima: ${denunciaInt.anonima ? 'Sí' : 'No'}
`;
  } else {
    const denunciaPub = denuncia as DenunciaPublica;
    prompt += `
- Categoría: ${denunciaPub.categoria}
- Estado: ${denunciaPub.estado}
- Ubicación: ${denunciaPub.ubicacion || 'No especificada'}
- Fecha del incidente: ${new Date(denunciaPub.fechaIncidente).toLocaleDateString()}
- Denunciante: ${denunciaPub.denunciante.anonimo ? 'Anónimo' : `${denunciaPub.denunciante.nombre} ${denunciaPub.denunciante.apellido}`}
`;
  }

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

// Función principal para generar reporte legal
export const generarReporteLegal = async (
  denuncia: DenunciaInterna | DenunciaPublica,
  opciones: OpcionesReporte = {
    incluirFundamentoLegal: true,
    incluirRecomendaciones: true,
    incluirAnalisisRiesgo: true,
    tipoReporte: 'detallado'
  }
): Promise<ReporteLegal> => {
  try {
    // Generar el prompt
    const prompt = generarPromptReporte(denuncia, opciones);

    // Llamar a OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
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
    });

    const respuestaIA = response.choices[0].message.content || '';
    
    // Procesar la respuesta
    const { contenido, recomendaciones, fundamentoLegal, prioridad } = procesarRespuestaIA(respuestaIA);

    // Crear el reporte
    const reporte: ReporteLegal = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      denunciaId: denuncia.id || '',
      tipo: 'tipo' in denuncia && 'comunidadId' in denuncia ? 'interno' : 'publico',
      titulo: `Reporte Legal: ${denuncia.titulo}`,
      contenido,
      fechaGeneracion: new Date(),
      recomendaciones,
      fundamentoLegal,
      prioridad
    };

    return reporte;

  } catch (error) {
    console.error('Error generando reporte legal:', error);
    throw new Error('No se pudo generar el reporte legal. Verifica tu conexión y configuración de API.');
  }
};

// Función para exportar reporte a PDF (básico)
export const exportarReporteAPDF = async (reporte: ReporteLegal): Promise<string> => {
  // Esta función podría implementar jsPDF o una biblioteca similar
  // Por ahora retorna el contenido formateado para descarga
  const contenidoFormateado = `
REPORTE LEGAL - SISTEMA DE GESTIÓN DE DENUNCIAS COMUNITARIAS
================================================================

Título: ${reporte.titulo}
Fecha de Generación: ${reporte.fechaGeneracion.toLocaleDateString()}
ID del Reporte: ${reporte.id}
Prioridad: ${reporte.prioridad.toUpperCase()}

${reporte.contenido}

================================================================
Generado automáticamente por el Sistema de Gestión de Denuncias
`;

  return contenidoFormateado;
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
      .slice(0, 5)
  };

  return stats;
};
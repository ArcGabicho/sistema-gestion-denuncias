import OpenAI from 'openai';

// Verificar si la API key está configurada
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
}) : null;

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AnalysisContext {
  totalDenuncias: number;
  denunciasPorCategoria: Record<string, number>;
  denunciasPorEstado: Record<string, number>;
  tendenciasRecientes: { descripcion: string; cambio: number; periodo: string }[];
  zonasConflictivas: { zona: string; cantidad: number; coordenadas?: string }[];
  estadisticas: {
    promedioResolucion: number;
    satisfaccionPromedio: number;
    denunciasUltimaSemana: number;
    crecimientoMensual: number;
  };
}

export class OpenAIService {
  private context: AnalysisContext | null = null;
  
  private isConfigured(): boolean {
    return openai !== null && apiKey !== undefined;
  }

  private throwIfNotConfigured(): void {
    if (!this.isConfigured()) {
      throw new Error('OpenAI no está configurado. Por favor, configura NEXT_PUBLIC_OPENAI_API_KEY en tu archivo .env.local');
    }
  }

  private systemPrompt = `Eres un asistente especializado en análisis de datos para un sistema de gestión de denuncias comunitarias.

Tu función es:
1. Analizar datos de denuncias y proporcionar insights valiosos
2. Identificar patrones y tendencias en los datos
3. Sugerir mejoras para optimizar el sistema
4. Responder preguntas sobre estadísticas y métricas
5. Generar reportes y análisis detallados

Siempre responde de manera profesional, clara y útil. Utiliza los datos proporcionados para dar respuestas precisas y basadas en evidencia.`;

  async initializeContext(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('OpenAI no está configurado. Usando datos simulados.');
      this.context = {
        totalDenuncias: 0,
        denunciasPorCategoria: {},
        denunciasPorEstado: {},
        tendenciasRecientes: [],
        zonasConflictivas: [],
        estadisticas: {
          promedioResolucion: 0,
          satisfaccionPromedio: 0,
          denunciasUltimaSemana: 0,
          crecimientoMensual: 0
        }
      };
      return;
    }

    try {
      // Importar dinámicamente el servicio de Firebase para evitar problemas de SSR
      const { firebaseAnalyticsService } = await import('./firebaseAnalyticsService');
      this.context = await firebaseAnalyticsService.getAnalysisContext();
    } catch (error) {
      console.error('Error initializing context:', error);
      // Usar datos por defecto si no se puede conectar a Firebase
      this.context = {
        totalDenuncias: 0,
        denunciasPorCategoria: {},
        denunciasPorEstado: {},
        tendenciasRecientes: [],
        zonasConflictivas: [],
        estadisticas: {
          promedioResolucion: 0,
          satisfaccionPromedio: 0,
          denunciasUltimaSemana: 0,
          crecimientoMensual: 0
        }
      };
    }
  }

  async sendMessage(userMessage: string, conversationHistory: ChatMessage[]): Promise<ChatMessage> {
    this.throwIfNotConfigured();
    
    const contextPrompt = this.context ? this.generateContextPrompt() : '';
    
    // Convertir historial de conversación al formato de OpenAI
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system' as const, content: this.systemPrompt },
      ...(contextPrompt ? [{ role: 'system' as const, content: contextPrompt }] : []),
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      { role: 'user' as const, content: userMessage }
    ];

    const response = await openai!.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openaiMessages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiResponse = response.choices[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.';

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
  }

  private generateContextPrompt(): string {
    if (!this.context) return '';

    return `Contexto actual del sistema:
- Total de denuncias: ${this.context.totalDenuncias}
- Denuncias por categoría: ${JSON.stringify(this.context.denunciasPorCategoria)}
- Denuncias por estado: ${JSON.stringify(this.context.denunciasPorEstado)}
- Tendencias recientes: ${this.context.tendenciasRecientes.map(t => t.descripcion).join('; ')}
- Zonas conflictivas: ${this.context.zonasConflictivas.map(z => z.zona).join('; ')}
- Estadísticas: Promedio resolución ${this.context.estadisticas.promedioResolucion} días, ${this.context.estadisticas.denunciasUltimaSemana} denuncias esta semana`;
  }

  async generateAnalysis(): Promise<string> {
    this.throwIfNotConfigured();

    const prompt = "Genera un análisis detallado de los datos de denuncias actuales, incluyendo patrones, tendencias y recomendaciones.";
    return this.callOpenAI(prompt);
  }

  async generateInsights(): Promise<string> {
    this.throwIfNotConfigured();

    const prompt = "Proporciona insights automáticos basados en los datos actuales de denuncias. Identifica oportunidades de mejora y áreas de atención.";
    return this.callOpenAI(prompt);
  }

  async categorizeComplaints(): Promise<string> {
    this.throwIfNotConfigured();

    const prompt = "Analiza las categorías de denuncias actuales y sugiere una clasificación optimizada. Identifica categorías emergentes o subcategorías necesarias.";
    return this.callOpenAI(prompt);
  }

  async assessRisks(): Promise<string> {
    this.throwIfNotConfigured();

    const prompt = "Realiza una evaluación de riesgos basada en los datos de denuncias. Identifica zonas de alto riesgo y factores críticos.";
    return this.callOpenAI(prompt);
  }

  async optimizeProcesses(): Promise<string> {
    this.throwIfNotConfigured();

    const prompt = "Analiza los procesos actuales de gestión de denuncias y proporciona recomendaciones específicas para optimizar la eficiencia y tiempo de respuesta.";
    return this.callOpenAI(prompt);
  }

  async generateReport(): Promise<string> {
    this.throwIfNotConfigured();

    const prompt = "Genera un reporte ejecutivo completo con las métricas más importantes, tendencias clave y recomendaciones estratégicas.";
    return this.callOpenAI(prompt);
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const contextPrompt = this.context ? this.generateContextPrompt() : '';
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system' as const, content: this.systemPrompt },
      ...(contextPrompt ? [{ role: 'system' as const, content: contextPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ];

    const response = await openai!.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'No pude generar una respuesta en este momento.';
  }
}

export const openaiService = new OpenAIService();

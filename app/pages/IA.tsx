'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  User, 
  FileText,
  TrendingUp,
  Shield,
  Lightbulb,
  Filter,
  RefreshCw,
  Sparkles,
  Zap,
  Brain,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { openaiService, ChatMessage } from '@/app/services/openaiService';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

const IA = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA para el sistema de gestión de denuncias. Puedo ayudarte con análisis de datos, sugerencias de mejora, y responder preguntas sobre el sistema. ¿En qué puedo asistirte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar contexto de IA al cargar la página
  useEffect(() => {
    const initializeAI = async () => {
      try {
        await openaiService.initializeContext();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error inicializando IA:', error);
        toast.error('Error al inicializar el asistente de IA');
      }
    };

    initializeAI();
  }, []);


  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await openaiService.sendMessage(inputMessage, messages);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      toast.error('Error al comunicarse con la IA. Verifica tu configuración de OpenAI.');
      
      // Mensaje de fallback
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo más tarde o verifica la configuración de la API de OpenAI.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const aiTools: AITool[] = [
    {
      id: 'analysis',
      name: 'Análisis Predictivo',
      description: 'Predice tendencias y patrones en las denuncias',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-blue-500 to-blue-600',
      action: async () => {
        setSelectedTool('analysis');
        setIsLoading(true);
        try {
          const analysis = await openaiService.generateAnalysis();
          const analysisMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: analysis,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, analysisMessage]);
          toast.success('Análisis generado exitosamente');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          toast.error('Error al generar análisis');
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      id: 'insights',
      name: 'Insights Automáticos',
      description: 'Genera insights automáticos de los datos',
      icon: <Lightbulb className="h-5 w-5" />,
      color: 'from-yellow-500 to-yellow-600',
      action: async () => {
        setSelectedTool('insights');
        setIsLoading(true);
        try {
          const insights = await openaiService.generateInsights();
          const insightsMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: insights,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, insightsMessage]);
          toast.success('Insights generados exitosamente');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          toast.error('Error al generar insights');
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      id: 'categorization',
      name: 'Categorización IA',
      description: 'Clasifica automáticamente las denuncias',
      icon: <Filter className="h-5 w-5" />,
      color: 'from-green-500 to-green-600',
      action: async () => {
        setSelectedTool('categorization');
        setIsLoading(true);
        try {
          const categories = await openaiService.categorizeComplaints();
          const categoriesMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: categories,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, categoriesMessage]);
          toast.success('Categorización completada');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          toast.error('Error en categorización');
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      id: 'risk-assessment',
      name: 'Evaluación de Riesgos',
      description: 'Evalúa el nivel de riesgo de las denuncias',
      icon: <Shield className="h-5 w-5" />,
      color: 'from-red-500 to-red-600',
      action: async () => {
        setSelectedTool('risk-assessment');
        setIsLoading(true);
        try {
          const riskAssessment = await openaiService.assessRisks();
          const riskMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: riskAssessment,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, riskMessage]);
          toast.success('Evaluación de riesgos completada');
        } catch (error) {
          console.error('Error:', error);
          toast.error('Error en evaluación de riesgos');
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      id: 'optimization',
      name: 'Optimización de Procesos',
      description: 'Sugiere mejoras en los procesos actuales',
      icon: <Target className="h-5 w-5" />,
      color: 'from-purple-500 to-purple-600',
      action: async () => {
        setSelectedTool('optimization');
        setIsLoading(true);
        try {
          const optimization = await openaiService.optimizeProcesses();
          const optimizationMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: optimization,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, optimizationMessage]);
          toast.success('Optimización generada exitosamente');
        } catch (error) {
          console.error('Error:', error);
          toast.error('Error en optimización');
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      id: 'reports',
      name: 'Reportes Inteligentes',
      description: 'Genera reportes automáticos con IA',
      icon: <FileText className="h-5 w-5" />,
      color: 'from-indigo-500 to-indigo-600',
      action: async () => {
        setSelectedTool('reports');
        setIsLoading(true);
        try {
          const report = await openaiService.generateReport();
          const reportMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: report,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, reportMessage]);
          toast.success('Reporte generado exitosamente');
        } catch (error) {
          console.error('Error:', error);
          toast.error('Error al generar reporte');
        } finally {
          setIsLoading(false);
        }
      }
    }
  ];

  const getMessageIcon = (role: string) => {
    if (role === 'assistant') {
      return <Bot className="h-4 w-4 text-green-400" />;
    }
    return <User className="h-4 w-4 text-blue-400" />;
  };

  const getMessageBgColor = (role: string) => {
    if (role === 'assistant') {
      return 'bg-zinc-800/50 border-zinc-700/50';
    }
    return 'bg-red-900/30 border-red-700/50';
  };

  return (
    <div className="p-4 h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex-shrink-0"
        >
          <h1 className="text-xl font-bold text-white mb-1 flex items-center">
            <Brain className="mr-2 h-5 w-5 text-purple-400" />
            Asistente de IA
          </h1>
          <p className="text-zinc-400 text-sm">Herramientas inteligentes para análisis y gestión de denuncias</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          {/* Panel de Herramientas IA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 border border-zinc-700/50 h-full flex flex-col">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center">
                <Zap className="mr-2 h-4 w-4 text-yellow-400" />
                Herramientas IA
              </h3>
              
              <div className="grid grid-cols-1 gap-2 flex-1">
                {aiTools.map((tool) => (
                  <motion.button
                    key={tool.id}
                    onClick={tool.action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-2 rounded-lg border transition-all duration-200 text-left ${
                      selectedTool === tool.id 
                        ? 'bg-zinc-700/70 border-zinc-600' 
                        : 'bg-zinc-800/30 border-zinc-700/30 hover:bg-zinc-700/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center mb-1`}>
                      <div className="scale-75">{tool.icon}</div>
                    </div>
                    <h4 className="text-white font-medium text-xs mb-0.5">{tool.name}</h4>
                    <p className="text-zinc-400 text-xs leading-tight">{tool.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Chat de IA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 h-full flex flex-col">
              {/* Header del Chat */}
              <div className="p-3 border-b border-zinc-700/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Asistente IA</h3>
                      <p className="text-zinc-400 text-xs">En línea • Respuesta inteligente</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMessages(messages.slice(0, 1))}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
                        <div className={`p-2 rounded-lg border ${getMessageBgColor(message.role)}`}>
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {getMessageIcon(message.role)}
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-zinc-500 text-xs">
                                  {message.timestamp.toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Indicador de escritura */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-zinc-800/50 border border-zinc-700/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-3 w-3 text-green-400" />
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-zinc-400 text-xs">Procesando...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="p-3 border-t border-zinc-700/50 flex-shrink-0">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu consulta aquí..."
                      disabled={isLoading}
                      className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                {/* Sugerencias rápidas */}
                <div className="flex flex-wrap gap-1">
                  {[
                    'Analizar tendencias',
                    'Generar reporte',
                    'Sugerencias',
                    'Evaluar riesgos'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-2 py-1 bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 hover:text-white text-xs rounded-full border border-zinc-600/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IA;

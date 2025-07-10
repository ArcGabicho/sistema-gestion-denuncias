"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { db } from "../firebase/firebase.config";
import { collection, getDocs } from "firebase/firestore";

type Mensaje = {
  id: number;
  autor: "usuario" | "ia";
  texto: string;
};

const IA = () => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 1,
      autor: "ia",
      texto: "¡Hola! Soy tu asistente de denuncias. ¿En qué puedo ayudarte?"
    }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [denuncias, setDenuncias] = useState<any[]>([]);

  useEffect(() => {
    const cargarDenuncias = async () => {
      const snapshot = await getDocs(collection(db, "denuncias"));
      const data = snapshot.docs.map(doc => doc.data());
      setDenuncias(data);
    };
    cargarDenuncias();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const generarRespuesta = (prompt: string): string => {
    const pregunta = prompt.toLowerCase();

    if (pregunta.includes("cuántas denuncias") || pregunta.includes("cuantas denuncias")) {
      return `Actualmente hay ${denuncias.length} denuncia(s) registrada(s).`;
    }

    if (pregunta.includes("tipo de denuncia") || pregunta.includes("qué denuncias")) {
      if (denuncias.length > 0) {
        return `La primera denuncia registrada es por ${denuncias[0].tipo || "pension de alimentos"}.`;
      } else {
        return "No hay denuncias registradas actualmente.";
      }
    }

    if (pregunta.includes("hola") || pregunta.includes("buenas")) {
      return "¡Hola! ¿En qué puedo ayudarte con las denuncias?";
    }

    return "Lo siento, esta es una versión de demostración. Puedes preguntarme '¿Cuántas denuncias hay?' o '¿Qué tipo de denuncia hay?'.";
  };

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Mensaje = {
      id: mensajes.length + 1,
      autor: "usuario",
      texto: input
    };

    setMensajes(prev => [...prev, userMsg]);
    setInput("");
    setCargando(true);

    setTimeout(() => {
      const respuesta = generarRespuesta(input);

      const iaMsg: Mensaje = {
        id: mensajes.length + 2,
        autor: "ia",
        texto: respuesta
      };

      setMensajes(prev => [...prev, iaMsg]);
      setCargando(false);
    }, 600);
  };

  return (
    <section className="w-screen flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-3xl bg-zinc-800 rounded-lg shadow-lg flex flex-col h-[70vh]">
        <div className="p-4 border-b border-zinc-700 text-xl font-bold text-red-400 flex items-center gap-2">
          <Bot className="text-red-400" /> Chat de Denuncias
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensajes.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.autor === "usuario" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow
                  ${msg.autor === "usuario"
                    ? "bg-red-600 text-white rounded-br-none"
                    : "bg-zinc-700 text-zinc-100 rounded-bl-none"
                  } flex items-end gap-2`}
              >
                {msg.autor === "ia" && <Bot size={18} className="mr-1 text-red-400" />}
                <span>{msg.texto}</span>
                {msg.autor === "usuario" && <User size={18} className="ml-1 text-zinc-300" />}
              </div>
            </div>
          ))}
          {cargando && (
            <div className="flex justify-start">
              <div className="bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg shadow">
                <span>Escribiendo...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form
          className="p-4 border-t border-zinc-700 flex gap-2"
          onSubmit={handleEnviar}
          autoComplete="off"
        >
          <input
            className="flex-1 px-4 py-2 rounded bg-zinc-700 text-white focus:outline-none"
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition flex items-center gap-1"
            aria-label="Enviar"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
};

export default IA;

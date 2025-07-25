"use client";

import { useState } from "react";

function IA() {
  const [mensaje, setMensaje] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviarPregunta = async () => {
    if (!mensaje.trim()) return;

    setCargando(true);
    setRespuesta("");

    try {
      const res = await fetch("/api/chat-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mensaje }),
      });

      const data = await res.json();
      setRespuesta(data.respuesta || "No se recibió respuesta.");
    } catch (error) {
      console.error("Error al consultar la IA:", error);
      setRespuesta("Ocurrió un error al obtener respuesta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Asistente IA de Denuncias</h1>

      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        placeholder="Escribe tu pregunta aquí..."
      />

      <button
        onClick={enviarPregunta}
        disabled={cargando}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {cargando ? "Consultando..." : "Enviar"}
      </button>

      {respuesta && (
        <div className="mt-6 p-4 bg-gray-100 rounded border border-gray-300 whitespace-pre-wrap">
          <strong>Respuesta IA:</strong>
          <p>{respuesta}</p>
        </div>
      )}
    </div>
  );
}

export default IA;
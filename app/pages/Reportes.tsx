"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../firebase/firebase.config";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

const db = getFirestore(app);

const Reportes = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [tituloSeleccionado, setTituloSeleccionado] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");

  useEffect(() => {
    const fetchDenuncias = async () => {
      const snap = await getDocs(collection(db, "denuncias"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDenuncias(list);
    };
    fetchDenuncias();
  }, []);

  const descargarPDF = () => {
    if (!tituloSeleccionado || !nombreArchivo.trim()) {
      alert("Por favor selecciona una denuncia y escribe un nombre para el PDF.");
      return;
    }

    const denuncia = denuncias.find(d => d.title === tituloSeleccionado);
    if (!denuncia) {
      alert("No se encontró la denuncia seleccionada.");
      return;
    }

    const doc = new jsPDF();

    // Cabecera
    doc.setFontSize(16);
    doc.text("INFORME DE DENUNCIA", 10, 20);
    doc.setFontSize(12);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-PE")}`, 10, 30);

    // Cuerpo del reporte
    const contenido = `
Título: ${denuncia.title}
Tipo de delito: ${denuncia.crimeType}
Fecha de denuncia: ${denuncia.date}
Estado: ${denuncia.status}
Ubicación: ${denuncia.location}

Descripción:
${denuncia.description}

WhatsApp de contacto: ${denuncia.whatsapp}
`.trim();

    const lineas = doc.splitTextToSize(contenido, 180);
    doc.text(lineas, 10, 45);

    // Guardar PDF
    const nombre = `${nombreArchivo.trim().replace(/\s+/g, "_")}.pdf`;
    doc.save(nombre);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen text-white p-8">
      <div className="space-y-4 max-w-xl w-full">
        <label className="block">
          <span className="text-sm text-zinc-300">Seleccionar denuncia por título:</span>
          <select
            value={tituloSeleccionado}
            onChange={e => setTituloSeleccionado(e.target.value)}
            className="w-full mt-1 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
          >
            <option value="">-- Selecciona una denuncia --</option>
            {denuncias.map(d => (
              <option key={d.id} value={d.title}>
                {d.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-300">Nombre del archivo PDF:</span>
          <input
            type="text"
            value={nombreArchivo}
            onChange={e => setNombreArchivo(e.target.value)}
            className="w-full mt-1 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
            placeholder="Ej: Reporte_Padre_Ausente"
          />
        </label>

        <button
          onClick={descargarPDF}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          <Download size={16} /> Descargar PDF
        </button>
      </div>
    </div>
  );
};

export default Reportes;
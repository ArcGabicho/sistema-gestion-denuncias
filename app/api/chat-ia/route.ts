import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../../firebase/firebase.config";

const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Falta el campo prompt" }, { status: 400 });
    }

    // Leer denuncias desde Firebase
    const snapshot = await getDocs(collection(db, "denuncias"));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resumen = snapshot.docs.map(doc => {
      const data = doc.data();
      return `Título: ${data.titulo}, Tipo: ${data.tipo}, Ubicación: ${data.ubicacion}, Estado: ${data.estatus}`;
    }).slice(0, 5).join(" | ");

    const systemPrompt = `
        Eres un asistente legal virtual que responde preguntas sobre denuncias.
        Responde de forma clara y útil.
    `;


    // Llamada a OpenAI
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // también puedes usar "gpt-4" si tienes acceso
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    const result = await completion.json();
    console.log("🔍 Respuesta de OpenAI:", JSON.stringify(result, null, 2)); // 👈 log completo

    // DEBUG: Log para saber qué respondió OpenAI
    console.log("Respuesta OpenAI:", JSON.stringify(result, null, 2));

    const reply = result?.choices?.[0]?.message?.content;

    if (!reply) {
        return NextResponse.json({ 
        reply: "Lo siento, no pude generar una respuesta válida.",
        debug: result // 👈 Muestra el resultado completo en el frontend también
    }, { status: 200 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error en /api/chat-ia:", error);
    return NextResponse.json({ error: "Error al procesar la consulta" }, { status: 500 });
  }
}

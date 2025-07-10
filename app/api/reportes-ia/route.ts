import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Configuración Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicializa Firebase solo una vez
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ reply: "Falta el campo prompt." }, { status: 400 });
    }

    // Obtener denuncias
    const snapshot = await getDocs(collection(db, "denuncias"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const denuncias: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      denuncias.push({
        Titulo: data.title,
        Tipo: data.crimeType,
        Fecha: data.date,
        Estado: data.status,
        Ubicacion: data.location,
        Descripcion: data.description,
        Contacto: data.whatsapp
      });
    });

    // Construir prompt final
    const promptFinal = `
Eres un abogado experto en análisis legal. A continuación tienes denuncias reales en formato JSON:

${JSON.stringify(denuncias, null, 2)}

Responde la siguiente pregunta únicamente con base en estos datos:
"${prompt}"
`;

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Eres un abogado experto que analiza datos legales de denuncias proporcionadas en formato JSON."
          },
          {
            role: "user",
            content: promptFinal
          }
        ],
        temperature: 0.3
      })
    });

    const result = await completion.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Sin respuesta válida:", result);
      return NextResponse.json({ reply: "No se pudo generar una respuesta válida." }, { status: 500 });
    }

    return NextResponse.json({ reply: content });
  } catch (error) {
    console.error("Error en /api/chat-ia:", error);
    return NextResponse.json({ reply: "Ocurrió un error en el servidor." }, { status: 500 });
  }
}
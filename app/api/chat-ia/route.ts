import { NextResponse } from "next/server";
import OpenAI from "openai";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore(app);

export async function POST(req: Request) {
  const { mensaje } = await req.json();

  const snapshot = await db.collection("denuncias").get();

  const datos = snapshot.docs.map((doc) => {
    const data = doc.data();
    return `Denuncia: ${data.descripcion}. Estado: ${data.estado}. Fecha: ${data.fecha}`;
  });

  const prompt = `
Eres un asistente inteligente que responde preguntas basadas en la siguiente información de Firestore:

${datos.join("\n")}

Usuario: ${mensaje}
Asistente:
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  return NextResponse.json({ respuesta: completion.choices[0].message.content });
}

// Archivo temporal para probar la conexión a Firebase
// Este archivo se puede eliminar después de verificar que todo funciona

console.log('Testing Firebase connection...');

// Verificar que las variables de entorno estén configuradas
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***configured***' : 'MISSING',
});

console.log('OpenAI API Key:', process.env.NEXT_PUBLIC_OPENAI_API_KEY ? '***configured***' : 'MISSING');
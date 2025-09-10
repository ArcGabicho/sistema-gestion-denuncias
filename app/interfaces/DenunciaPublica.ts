export interface Evidencia {
  tipo: "imagen" | "video" | "documento" | "audio" | "otro";
  url: string;
  nombre?: string;
  extension?: string;
}

export interface Comentario {
  id: string;
  autor: string;
  contenido: string;
  fecha: Date | string;
  anonimo: boolean;
}

export interface Interaccion {
  meImporta: string[]; // Array de IDs de usuarios que dieron "me importa"
  comentarios: Comentario[];
  compartido: number; // Contador de veces compartida
}

export interface Denunciante {
  anonimo: boolean;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export interface DenunciaPublica {
  id?: string;
  titulo: string;
  descripcion: string;
  categoria: "ruido" | "seguridad" | "basura" | "transito" | "infraestructura" | "servicios" | "vandalismo" | "animales" | "vecinos" | "emergencia" | "otro";
  fechaIncidente: Date | string;
  ubicacion?: string;
  evidencias?: Evidencia[];
  denunciante: Denunciante;
  fechaCreacion: Date | string;
  estado: "pendiente" | "en_revision" | "resuelto" | "cerrado";
  interacciones?: Interaccion;
}
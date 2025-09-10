import { firestore } from 'firebase-admin';

// Array de faltas administrativas típicas en un barrio
export const FALTAS_ADMINISTRATIVAS = [
  'ruido',
  'basura',
  'construccion',
  'seguridad',
  'mascotas',
  'ocupacion_espacio_publico',
  'vandalismo',
  'vehiculos_mal_estacionados',
  'iluminacion',
  'otros'
] as const;

export type FaltaAdministrativa = typeof FALTAS_ADMINISTRATIVAS[number];

export interface DenunciaInterna {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: FaltaAdministrativa;
  estado: 'pendiente' | 'en_proceso' | 'resuelta' | 'rechazada';
  comunidadId: string; // Comunidad/barrio donde ocurre la falta
  denuncianteId?: string;    // Puede ser opcional (undefined si es anónimo)
  fechaCreacion: firestore.Timestamp;
  fechaActualizacion: firestore.Timestamp;
  ubicacion?: string; // Dirección o referencia dentro del barrio
  evidenciaUrls?: string[]; // Fotos, videos, documentos
  comentarios?: Array<{
    usuarioId: string;
    mensaje: string;
    fecha: firestore.Timestamp;
  }>;
  anonima: boolean; 
  // Puedes agregar más campos según necesidad
}
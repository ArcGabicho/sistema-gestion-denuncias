import { Timestamp } from "firebase/firestore";

export interface Comunidad {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  privacity: 'public' | 'private';
  administradorId: string; // ID del usuario administrador principal
  logoUrl?: string;
  isActive: boolean;
  invitationCode?: string; // Código de invitación para miembros
}
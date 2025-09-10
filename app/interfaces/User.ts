import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  role: 'admin' | 'member';
  comunidadId: string; // ID de la comunidad/tenant a la que pertenece el usuario
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  phone?: string;
  avatarUrl?: string;
}
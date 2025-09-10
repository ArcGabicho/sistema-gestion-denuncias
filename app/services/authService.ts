import { auth, db } from "@/app/utils/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { User } from "@/app/interfaces/User";
import { Comunidad } from "@/app/interfaces/Comunidad";

// Servicio para registrar administrador y crear comunidad
export const registerAdmin = async (adminData: {
  email: string;
  password: string;
  name: string;
  lastname: string;
  phone?: string;
}, comunidadData: {
  nombre: string;
  descripcion: string;
  direccion: string;
}, preferencesData: {
  privacity: 'public' | 'private';
  logoUrl?: string;
  invitationCode?: string;
}) => {
  try {
    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
    const firebaseUser = userCredential.user;

    // 2. Crear documento de comunidad primero
    const comunidadRef = await addDoc(collection(db, 'comunidades'), {
      nombre: comunidadData.nombre,
      descripcion: comunidadData.descripcion,
      direccion: comunidadData.direccion,
      privacity: preferencesData.privacity,
      logoUrl: preferencesData.logoUrl || '',
      invitationCode: preferencesData.invitationCode || '',
      administradorId: firebaseUser.uid,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Omit<Comunidad, 'id'>);

    // 3. Crear documento de usuario con referencia a la comunidad
    const userData: Omit<User, 'id'> = {
      email: adminData.email,
      name: adminData.name,
      lastname: adminData.lastname,
      role: 'admin',
      comunidadId: comunidadRef.id,
      phone: adminData.phone || '',
      avatarUrl: '',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      success: true,
      user: { id: firebaseUser.uid, ...userData },
      comunidad: { id: comunidadRef.id, ...comunidadData, ...preferencesData }
    };

  } catch (error: unknown) {
    console.error('Error registering admin:', error);
    const message = error instanceof Error ? error.message : 'Error al registrar administrador';
    throw new Error(message);
  }
};

// Servicio para registrar miembro
export const registerMember = async (memberData: {
  email: string;
  password: string;
  name: string;
  lastname: string;
  phone?: string;
  invitationCode: string;
}) => {
  try {
    // 1. Validar código de invitación y obtener comunidad
    const comunidad = await validateInvitationCode(memberData.invitationCode);
    
    if (!comunidad) {
      throw new Error('Código de invitación inválido');
    }

    // 2. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, memberData.email, memberData.password);
    const firebaseUser = userCredential.user;

    // 3. Crear documento de usuario
    const userData: Omit<User, 'id'> = {
      email: memberData.email,
      name: memberData.name,
      lastname: memberData.lastname,
      role: 'member',
      comunidadId: comunidad.id,
      phone: memberData.phone || '',
      avatarUrl: '',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      success: true,
      user: { id: firebaseUser.uid, ...userData },
      comunidad
    };

  } catch (error: unknown) {
    console.error('Error registering member:', error);
    const message = error instanceof Error ? error.message : 'Error al registrar miembro';
    throw new Error(message);
  }
};

// Servicio para validar código de invitación
export const validateInvitationCode = async (invitationCode: string): Promise<Comunidad | null> => {
  try {
    // Buscar en la colección de comunidades por un campo de código de invitación
    // En una implementación real, tendrías un campo 'invitationCode' en cada comunidad
    const q = query(
      collection(db, 'comunidades'), 
      where('invitationCode', '==', invitationCode.toUpperCase()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const comunidadDoc = querySnapshot.docs[0];
    const comunidadData = comunidadDoc.data() as Omit<Comunidad, 'id'>;
    
    return {
      id: comunidadDoc.id,
      ...comunidadData
    } as Comunidad;

  } catch (error) {
    console.error('Error validating invitation code:', error);
    return null;
  }
};

// Servicio para login
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Obtener datos adicionales del usuario
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado en la base de datos');
    }

    const userData = userDoc.data() as Omit<User, 'id'>;
    
    return {
      success: true,
      user: { id: firebaseUser.uid, ...userData }
    };

  } catch (error: unknown) {
    console.error('Error logging in:', error);
    const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
    throw new Error(message);
  }
};

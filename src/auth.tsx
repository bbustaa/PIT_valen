// src/auth.tsx

import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { firestore } from './firebaseConfig'; // Importa firestore
import { collection, addDoc } from "firebase/firestore"; // Firestore para guardar los datos del perfil

// Función para registrar un usuario con email y contraseña en Firebase Authentication
export async function registrarUsuario(email: string, password: string) {
  const auth = getAuth();
  
  try {
    // Verificar si el correo ya está registrado
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      throw new Error("El correo electrónico ya está registrado.");
    }

    // Registrar al usuario
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Usuario registrado:", user);
    return user;
  } catch (error: any) {
    console.error("Error al registrar el usuario:", error.message);
    throw error;
  }
}

// Función para guardar el perfil del usuario en Firestore con 6 argumentos
export async function guardarPerfil(email: string, nombre: string, apellido1: string, apellido2: string, direccion: string, foto: string) {
    try {
      const docRef = await addDoc(collection(firestore, "profiles"), {
        email,
        nombre,
        apellido1,
        apellido2,
        direccion,
        foto
      });
      console.log("Perfil guardado con ID:", docRef.id);
      return docRef;
    } catch (error) {
      console.error("Error al guardar el perfil en Firestore:", error);
      throw error; // Lanza el error para manejarlo en el componente
    }
  }

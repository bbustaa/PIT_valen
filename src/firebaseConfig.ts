// src/firebaseConfig.ts

// Importa las funciones que necesitas desde el SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Importa auth y GoogleAuthProvider
import { getFirestore } from "firebase/firestore"; // Asegúrate de importar esto

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFp3pj2kYFi_vJrTs39v48YoPH-8qN16Q",
  authDomain: "proyectopit-dd152.firebaseapp.com",
  projectId: "proyectopit-dd152",
  storageBucket: "proyectopit-dd152.appspot.com",
  messagingSenderId: "65575641740",
  appId: "1:65575641740:web:fa9a465f51050132c891a9",
  measurementId: "G-N1W5TPWTXG"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

// Inicializa la autenticación
const auth = getAuth(app); // Añadir esta línea para la autenticación

// Configura el proveedor de Google
const googleProvider = new GoogleAuthProvider(); // Añadir esta línea para el proveedor de Google

// Exporta auth y googleProvider para que puedan ser utilizados en otros archivos
export { auth, googleProvider };
export const firestore = getFirestore(app);
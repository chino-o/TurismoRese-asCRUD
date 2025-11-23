// firebase.js

// 1. IMPORTAR: Agregamos las funciones de Storage (imágenes)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js"; // <--- IMPORTANTE

// -------------------------------------------------------------------------
// PEGA AQUÍ TUS CLAVES REALES DE FIREBASE
// -------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBW7HL6LZUnGP2aCHGn03e7UQAwqfOvsOw", 
  authDomain: "turismo-web-7cf8e.firebaseapp.com",
  projectId: "turismo-web-7cf8e",
  storageBucket: "turismo-web-7cf8e.firebasestorage.app", // <--- Asegúrate de que esto no esté vacío
  messagingSenderId: "1083955182766",
  appId: "1:1083955182766:web:5bd940c9cde8673e9f013f"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // <--- Inicializar Storage

// 2. EXPORTAR: ¡Asegúrate de que 'storage' y las otras estén aquí!
export { db, collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc, setDoc, storage, ref, uploadBytes, getDownloadURL };
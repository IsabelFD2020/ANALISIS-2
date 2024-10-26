import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Para Firestore (base de datos de documentos)

const firebaseConfig = {
    apiKey: "AIzaSyCvUnECFdiysFVTZa4ZG4yayYpPwUIsQx4",
    authDomain: "analisis2-f80a2.firebaseapp.com",
    projectId: "analisis2-f80a2",
    storageBucket: "analisis2-f80a2.appspot.com",
    messagingSenderId: "775487956655",
    appId: "1:775487956655:web:faf14026ec171707bc965a",
    measurementId: "G-6XJNN1GZXE"
};

// Inicializa la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Exporta Firestore o Realtime Database según lo que estés usando
export const db = getFirestore(app); // Para Firestore
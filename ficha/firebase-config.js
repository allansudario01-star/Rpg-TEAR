// firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyBMm5gE_WZqY1wgsXX1XPf5fA5gRtmQAwM",
    authDomain: "ficha-rpg-tear.firebaseapp.com",
    projectId: "ficha-rpg-tear",
    storageBucket: "ficha-rpg-tear.firebasestorage.app",
    messagingSenderId: "561881014024",
    appId: "1:561881014024:web:571cc10b50b20d2ee616bd"
};

const app = firebase.initializeApp(firebaseConfig);

// Exporte as instâncias (para compatibilidade)
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase inicializado com sucesso!");
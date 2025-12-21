// firebase-config.js - Configuração do Firebase

// Configurações do Firebase (substitua pelas suas se necessário)
const firebaseConfig = {
    apiKey: "AIzaSyBMm5gE_WZqY1wgsXX1XPf5fA5gRtmQAwM",
    authDomain: "ficha-rpg-tear.firebaseapp.com",
    projectId: "ficha-rpg-tear",
    storageBucket: "ficha-rpg-tear.firebasestorage.app",
    messagingSenderId: "561881014024",
    appId: "1:561881014024:web:571cc10b50b20d2ee616bd"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);

// Exportar instâncias para uso global (compatibilidade)
window.auth = firebase.auth();
window.db = firebase.firestore();


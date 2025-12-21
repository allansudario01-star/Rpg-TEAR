// firebase-service.js - Serviço completo do Firebase

const FirebaseService = {
    // Instâncias
    auth: null,
    db: null,
    currentUser: null,
    
    // Inicializar
    init() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        
        // Configurar persistência
        this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
    },
    
    // ========== AUTENTICAÇÃO ==========
    
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            callback(user);
        });
    },
    
    async login(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async register(email, password) {
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // async loginWithGoogle() {
    //     try {
    //         const provider = new firebase.auth.GoogleAuthProvider();
    //         const result = await this.auth.signInWithPopup(provider);
    //         return { success: true, user: result.user };
    //     } catch (error) {
    //         return { success: false, error: error.message };
    //     }
    // },
    
    async logout() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    isAuthenticated() {
        return this.currentUser !== null;
    },
    
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    },
    
    // ========== FIRESTORE ==========
    
    async saveFicha(fichaData, characterId = null) {
        if (!this.currentUser) {
            return { success: false, error: "Usuário não autenticado" };
        }
        
        try {
            const userId = this.currentUser.uid;
            
            // Preparar dados com metadados
            const fichaToSave = {
                ...fichaData,
                userId: userId,
                characterName: fichaData.characterName || 'Sem nome',
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            let fichaRef;
            
            if (characterId) {
                // Atualizar ficha existente
                fichaRef = this.db.collection('users').doc(userId).collection('fichas').doc(characterId);
                await fichaRef.update(fichaToSave);
            } else {
                // Criar nova ficha
                fichaRef = this.db.collection('users').doc(userId).collection('fichas').doc();
                fichaToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await fichaRef.set(fichaToSave);
            }
            
            return { 
                success: true, 
                characterId: fichaRef.id,
                data: fichaToSave
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async loadFicha(characterId) {
        if (!this.currentUser) {
            return { success: false, error: "Usuário não autenticado" };
        }
        
        try {
            const userId = this.currentUser.uid;
            const doc = await this.db.collection('users').doc(userId).collection('fichas').doc(characterId).get();
            
            if (doc.exists) {
                return { success: true, data: doc.data(), id: doc.id };
            } else {
                return { success: false, error: "Ficha não encontrada" };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async loadAllFichas() {
        if (!this.currentUser) {
            return { success: false, error: "Usuário não autenticado" };
        }
        
        try {
            const userId = this.currentUser.uid;
            const snapshot = await this.db.collection('users').doc(userId).collection('fichas').get();
            
            const fichas = [];
            snapshot.forEach(doc => {
                fichas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, fichas };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async deleteFicha(characterId) {
        if (!this.currentUser) {
            return { success: false, error: "Usuário não autenticado" };
        }
        
        try {
            const userId = this.currentUser.uid;
            await this.db.collection('users').doc(userId).collection('fichas').doc(characterId).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Inicializar automaticamente quando o arquivo carregar
document.addEventListener('DOMContentLoaded', () => {
    FirebaseService.init();
});
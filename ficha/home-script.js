// home-script.js - Lógica específica para a tela inicial

document.addEventListener('DOMContentLoaded', function() {
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const charactersContainer = document.getElementById('characters-container');
    const charactersList = document.getElementById('characters-list');
    const createNewBtn = document.getElementById('create-new-btn');
    
    // Observar estado de autenticação
    FirebaseService.onAuthStateChanged(async (user) => {
        if (user) {
            // Usuário logado
            userEmail.textContent = user.email;
            userInfo.style.display = 'block';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            charactersContainer.style.display = 'block';
            
            // Carregar personagens
            await loadUserCharacters(user.uid);
        } else {
            // Usuário não logado
            userInfo.style.display = 'none';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            charactersContainer.style.display = 'none';
        }
    });
    
    // Botão de Login
    loginBtn.addEventListener('click', async () => {
        const authResult = await showAuthDialog();
        if (authResult) {
            const user = FirebaseService.currentUser;
            await loadUserCharacters(user.uid);
        }
    });
    
    // Botão de Logout
    logoutBtn.addEventListener('click', async () => {
        await FirebaseService.logout();
    });
    
    // Botão Criar Novo
    createNewBtn.addEventListener('click', () => {
        localStorage.setItem('isNewCharacter', 'true');
        const url = new URL('ficha.html', window.location.href);
        url.searchParams.append('t', Date.now());
        window.location.href = url.toString();
    });
    
    // Função para carregar personagens
    async function loadUserCharacters(userId) {
        try {
            const result = await FirebaseService.loadAllFichas();
            
            charactersList.innerHTML = '';
            
            if (result.success && result.fichas.length > 0) {
                result.fichas.forEach(character => {
                    const characterDiv = document.createElement('div');
                    characterDiv.className = 'character-card';
                    characterDiv.style.cssText = `
                        background: rgba(255,255,255,0.05);
                        border: 1px solid var(--border);
                        border-radius: 10px;
                        padding: 20px;
                        margin-bottom: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                    `;
                    
                    characterDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <h3 style="color: var(--accent); margin-bottom: 5px;">${character.characterName || 'Sem Nome'}</h3>
                                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                    Nível ${character.level || 1} • 
                                    ${character.profession ? character.profession + ' • ' : ''}
                                    Criado: ${character.createdAt ? new Date(character.createdAt.seconds * 1000).toLocaleDateString() : 'Recentemente'}
                                </p>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn-load-character" data-id="${character.id}" 
                                style="padding: 8px 12px; background: var(--accent-blue); color: var(--primary); border: none; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-external-link-alt"></i> Carregar
                                </button>
                                <button class="btn-delete-character" data-id="${character.id}" data-name="${character.characterName || 'Personagem'}"
                                style="padding: 8px 12px; background: var(--danger); color: white; border: none; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-trash"></i> Deletar
                                </button>
                            </div>
                        </div>
                    `;
                    
                    charactersList.appendChild(characterDiv);
                });
                
                // Adicionar event listeners aos botões de carregar
                document.querySelectorAll('.btn-load-character').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const characterId = btn.getAttribute('data-id');
                        loadCharacter(characterId);
                    });
                });
                
                // Adicionar event listeners aos botões de deletar
                document.querySelectorAll('.btn-delete-character').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const characterId = btn.getAttribute('data-id');
                        const characterName = btn.getAttribute('data-name');
                        confirmDeleteCharacter(characterId, characterName);
                    });
                });
                
                // Clicar em qualquer lugar do card também carrega
                document.querySelectorAll('.character-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (!e.target.closest('.btn-load-character') && !e.target.closest('.btn-delete-character')) {
                            const btn = card.querySelector('.btn-load-character');
                            const characterId = btn.getAttribute('data-id');
                            loadCharacter(characterId);
                        }
                    });
                });
                
            } else {
                charactersList.innerHTML = `
                    <div class="no-characters" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <i class="fas fa-user-plus" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <p>Você ainda não tem personagens. Clique em "Criar Nova Ficha" para começar!</p>
                    </div>
                `;
            }
        } catch (error) {
            showNotification('Erro ao carregar personagens: ' + error.message, 'error');
        }
    }
    
    // Função para carregar personagem e ir para a ficha
    function loadCharacter(characterId) {
        localStorage.setItem('currentCharacterId', characterId);
        window.location.href = 'ficha.html';
    }
    
    // Função para confirmar e deletar um personagem
    async function confirmDeleteCharacter(characterId, characterName) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center;
            align-items: center; z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--card-bg); padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                <h2 style="color: var(--danger); margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i> Confirmar Exclusão
                </h2>
                <p style="color: var(--text); margin-bottom: 20px;">
                    Tem certeza que deseja excluir o personagem <strong>"${characterName}"</strong>?
                </p>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 25px;">
                    Esta ação não pode ser desfeita. Todos os dados do personagem serão perdidos permanentemente.
                </p>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="confirm-delete" style="flex: 1; padding: 12px; background: var(--danger); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-trash"></i> Sim, Excluir
                    </button>
                    <button id="cancel-delete" style="flex: 1; padding: 12px; background: var(--secondary); color: var(--text); border: 1px solid var(--border); border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
                
                <div id="delete-error" style="color: var(--danger); margin-top: 15px; display: none;"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Evento para confirmar exclusão
        document.getElementById('confirm-delete').addEventListener('click', async () => {
            try {
                // Mostrar estado de carregamento
                const confirmBtn = document.getElementById('confirm-delete');
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
                confirmBtn.disabled = true;
                
                // Chamar função de deletar do FirebaseService
                const result = await FirebaseService.deleteFicha(characterId);
                
                if (result.success) {
                    // Fechar modal
                    document.body.removeChild(modal);
                    
                    // Mostrar notificação de sucesso
                    showNotification(`Personagem "${characterName}" excluído com sucesso!`, 'success');
                    
                    // Recarregar lista de personagens
                    const user = FirebaseService.currentUser;
                    await loadUserCharacters(user.uid);
                    
                    // Se o personagem deletado era o atual, limpar o localStorage
                    const currentCharId = localStorage.getItem('currentCharacterId');
                    if (currentCharId === characterId) {
                        localStorage.removeItem('currentCharacterId');
                    }
                } else {
                    throw new Error(result.error || 'Erro ao excluir personagem');
                }
            } catch (error) {
                const errorEl = document.getElementById('delete-error');
                errorEl.textContent = 'Erro: ' + error.message;
                errorEl.style.display = 'block';
                
                // Reativar botão
                const confirmBtn = document.getElementById('confirm-delete');
                confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Sim, Excluir';
                confirmBtn.disabled = false;
            }
        });
        
        // Evento para cancelar exclusão
        document.getElementById('cancel-delete').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Fechar ao pressionar ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escHandler);
            }
        });
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Função para mostrar notificações
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 25px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--accent)'};
            color: white; border-radius: 8px; z-index: 10001;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;
            display: flex; align-items: center; gap: 10px;
        `;
        
        notification.innerHTML = `
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    // Função de autenticação
    async function showAuthDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8); display: flex; justify-content: center;
                align-items: center; z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div style="background: var(--card-bg); padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                    <h2 style="color: var(--accent); margin-bottom: 20px;">Login necessário</h2>
                    <p style="color: var(--text); margin-bottom: 20px;">Faça login para acessar a nuvem</p>
                    
                    <div style="margin-bottom: 15px;">
                        <input type="email" id="auth-email" placeholder="Email" style="width: 100%; padding: 12px; margin-bottom: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
                        <input type="password" id="auth-password" placeholder="Senha" style="width: 100%; padding: 12px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button id="auth-login" style="flex: 1; padding: 12px; background: var(--accent); color: var(--primary); border: none; border-radius: 5px; cursor: pointer;">Login</button>
                        <button id="auth-register" style="flex: 1; padding: 12px; background: var(--secondary); color: var(--text); border: 1px solid var(--border); border-radius: 5px; cursor: pointer;">Registrar</button>
                    </div>
                    
                    <button id="auth-cancel" style="width: 100%; padding: 12px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 5px; cursor: pointer;">
                        Cancelar
                    </button>
                    
                    <div id="auth-error" style="color: var(--danger); margin-top: 15px; display: none;"></div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            function handleAuthResult(result) {
                if (result.success) {
                    document.body.removeChild(modal);
                    resolve(true);
                } else {
                    const errorEl = document.getElementById('auth-error');
                    errorEl.textContent = result.error;
                    errorEl.style.display = 'block';
                }
            }
            
            document.getElementById('auth-login').addEventListener('click', async () => {
                const email = document.getElementById('auth-email').value;
                const password = document.getElementById('auth-password').value;
                const result = await FirebaseService.login(email, password);
                handleAuthResult(result);
            });
            
            document.getElementById('auth-register').addEventListener('click', async () => {
                const email = document.getElementById('auth-email').value;
                const password = document.getElementById('auth-password').value;
                const result = await FirebaseService.register(email, password);
                handleAuthResult(result);
            });
            
            document.getElementById('auth-cancel').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
            
            // Fechar ao pressionar ESC
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    document.body.removeChild(modal);
                    document.removeEventListener('keydown', escHandler);
                    resolve(false);
                }
            });
        });
    }
});
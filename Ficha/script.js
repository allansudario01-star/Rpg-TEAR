// script.js - COMPLETO COM FIREBASE

// ========== OBJETO FICHA CENTRAL ==========
const ficha = {
    // Informações básicas
    playerName: '',
    characterName: '',
    level: 1,
    money: 0,
    
    // Atributos principais
    attributes: {
        strength: { base: 1, mod: 0 },
        constitution: { base: 1, mod: 0 },
        dexterity: { base: 1, mod: 0 },
        intelligence: { base: 1, mod: 0 },
        spirit: { base: 1, mod: 0 },
        linecinese: { base: 1, mod: 0 }
    },
    
    // Sub-atributos Linecinese
    linAttributes: {
        attr1: { base: 0, mod: 0 },
        attr2: { base: 0, mod: 0 },
        attr3: { base: 0, mod: 0 },
        attr4: { base: 0, mod: 0 }
    },
    
    // Afinidade
    linAffinity: null,
    
    // Status
    health: { current: 9, max: 9 },
    essence: { current: 3, max: 3 },
    
    // Estado
    threadState: 'rest',
    tenseState: 'stable',
    
    // Características
    profession: '',
    web: '',
    background: '',
    
    // Bônus
    armor: 0,
    defenseBonus: 0,
    resistanceBonus: 0,
    essenceBonus: 0,
    
    // Reputação
    reputation: {
        weavers: 0,
        church: 0,
        periphery: 0,
        hunters: 0,
        survivors: 0
    },
    
    // Peculiaridades
    peculiarities: {},
    
    // Anotações
    history: '',
    personality: '',
    notes: '',
    
    // Metadados (para Firebase)
    userId: null,
    lastUpdated: null,
    createdAt: null
};

// ========== CONFIGURAÇÕES ==========
const peculiaritiesList = [
    { id: 'weapon-handling', name: 'Manuseio de Armas', attr: 'dexterity' },
    { id: 'religion', name: 'Religião', attr: 'intelligence' },
    { id: 'lin', name: 'LIN (Controle de Nó)', attr: 'linecinese' },
    { id: 'survival', name: 'Sobrevivência', attr: 'intelligence' },
    { id: 'diplomacy', name: 'Diplomacia', attr: 'spirit' },
    { id: 'stealth', name: 'Furtividade', attr: 'dexterity' },
    { id: 'strategy', name: 'Estratégia', attr: 'intelligence' },
    { id: 'fencing', name: 'Esgrima', attr: 'dexterity' },
    { id: 'archery', name: 'Arquearia', attr: 'dexterity' },
    { id: 'fortitude', name: 'Fortitude', attr: 'strength' },
    { id: 'acrobatics', name: 'Acrobacia', attr: 'dexterity' },
    { id: 'persuasion', name: 'Persuasão', attr: 'spirit' },
    { id: 'reflex', name: 'Reflexo', attr: 'dexterity' },
    { id: 'history', name: 'História', attr: 'intelligence' },
    { id: 'deception', name: 'Enganação', attr: 'spirit' },
    { id: 'perception', name: 'Percepção', attr: 'intelligence' },
    { id: 'investigation', name: 'Investigação', attr: 'intelligence' },
    { id: 'fight', name: 'Luta', attr: 'strength' },
    { id: 'athletics', name: 'Atletismo', attr: 'strength' },
    { id: 'medicine', name: 'Medicina', attr: 'intelligence' },
    { id: 'crime', name: 'Crime', attr: 'dexterity' },
    { id: 'thread-sensitivity', name: 'Sensibilidade ao Fio', attr: 'linecinese' },
    { id: 'intimidation', name: 'Intimidação', attr: 'spirit' },
    { id: 'craft', name: 'Ofício', attr: 'spirit' },
    { id: 'intuition', name: 'Intuição', attr: 'intelligence' },
    { id: 'will', name: 'Vontade', attr: 'spirit' }
];

const affinityMap = {
    1: { advantage: 1, disadvantage: 2, bonus: 5, penalty: -5 },
    2: { advantage: 2, disadvantage: 3, bonus: 5, penalty: -5 },
    3: { advantage: 3, disadvantage: 4, bonus: 5, penalty: -5 },
    4: { advantage: 4, disadvantage: 1, bonus: 5, penalty: -5 }
};

// ========== VARIÁVEIS GLOBAIS ==========
let currentCharacterId = null;
let isOverweight = false;
let inventorySlotsUsed = 0;

// ========== FUNÇÕES DE CÁLCULO ==========
function calculateTotalAttribute(attr) {
    return ficha.attributes[attr].base + ficha.attributes[attr].mod;
}

function calculateMaxHealth() {
    const constitution = calculateTotalAttribute('constitution');
    const strength = calculateTotalAttribute('strength');
    return (constitution * 3) + strength + (ficha.level * 5);
}

function calculateMaxEssence() {
    const linecinese = calculateTotalAttribute('linecinese');
    const spirit = calculateTotalAttribute('spirit');
    return (linecinese * 2) + spirit + ficha.essenceBonus;
}

function calculateDefense() {
    const dexterity = calculateTotalAttribute('dexterity');
    return Math.floor(10 + (dexterity / 3)) + ficha.armor + ficha.defenseBonus;
}

function calculateResistance() {
    const spirit = calculateTotalAttribute('spirit');
    const linecinese = calculateTotalAttribute('linecinese');
    return Math.floor(10 + (spirit / 2) + (linecinese / 5)) + ficha.resistanceBonus;
}

function calculateInitiative() {
    const dexterity = calculateTotalAttribute('dexterity');
    const intelligence = calculateTotalAttribute('intelligence');
    return (dexterity + intelligence) / 4;
}

function calculateCapacity() {
    return calculateTotalAttribute('strength') * 2;
}

function calculateLinGrade(value) {
    const grade = Math.min(Math.floor(value / 10) + 1, 5);
    return ['I', 'II', 'III', 'IV', 'V'][grade - 1];
}

function calculateTotalLinPoints() {
    let total = 0;
    for (let i = 1; i <= 4; i++) {
        const attr = ficha.linAttributes[`attr${i}`];
        total += attr.base + attr.mod;
    }
    return total;
}

function calculateAvailableLinPoints() {
    const linecinese = calculateTotalAttribute('linecinese');
    return linecinese - calculateTotalLinPoints();
}

function updateCalculations() {
    // Atualizar valores máximos
    ficha.health.max = calculateMaxHealth();
    ficha.essence.max = calculateMaxEssence();
    
    // Ajustar valores atuais
    if (ficha.health.current > ficha.health.max) ficha.health.current = ficha.health.max;
    if (ficha.essence.current > ficha.essence.max) ficha.essence.current = ficha.essence.max;
    
    // Atualizar dados calculados no DOM
    renderCalculatedValues();
}

// ========== FUNÇÕES DE INTERFACE ==========
function getFichaFromDOM() {
    // Informações básicas
    ficha.playerName = document.getElementById('player-name').value;
    ficha.characterName = document.getElementById('character-name').value;
    ficha.level = parseInt(document.getElementById('level').value) || 1;
    ficha.money = parseInt(document.getElementById('money').value) || 0;
    
    // Atributos
    const attrs = ['strength', 'constitution', 'dexterity', 'intelligence', 'spirit', 'linecinese'];
    attrs.forEach(attr => {
        ficha.attributes[attr].base = parseInt(document.getElementById(attr).value) || 1;
        ficha.attributes[attr].mod = parseInt(document.getElementById(`${attr}-mod`).value) || 0;
    });
    
    // Sub-atributos LIN
    for (let i = 1; i <= 4; i++) {
        const attr = ficha.linAttributes[`attr${i}`];
        attr.base = parseInt(document.getElementById(`lin-attr-${i}`).value) || 0;
        attr.mod = parseInt(document.getElementById(`lin-mod-${i}`).value) || 0;
    }
    
    // Afinidade
    ficha.linAffinity = document.getElementById('lin-affinity').value || null;
    
    // Status atuais
    ficha.health.current = parseInt(document.getElementById('current-health').value) || 0;
    ficha.essence.current = parseInt(document.getElementById('current-essence').value) || 0;
    
    // Estado
    ficha.threadState = document.getElementById('thread-state').value;
    ficha.tenseState = document.getElementById('tense-state').value;
    
    // Características
    ficha.profession = document.getElementById('profession').value;
    ficha.web = document.getElementById('web').value;
    ficha.background = document.getElementById('background').value;
    
    // Bônus
    ficha.armor = parseInt(document.getElementById('armor').value) || 0;
    ficha.defenseBonus = parseInt(document.getElementById('defense-bonus').value) || 0;
    ficha.resistanceBonus = parseInt(document.getElementById('resistance-bonus').value) || 0;
    ficha.essenceBonus = parseInt(document.getElementById('essence-bonus').value) || 0;
    
    // Reputação
    ficha.reputation.weavers = parseInt(document.getElementById('rep-weavers').value) || 0;
    ficha.reputation.church = parseInt(document.getElementById('rep-church').value) || 0;
    ficha.reputation.periphery = parseInt(document.getElementById('rep-periphery').value) || 0;
    ficha.reputation.hunters = parseInt(document.getElementById('rep-hunters').value) || 0;
    ficha.reputation.survivors = parseInt(document.getElementById('rep-survivors').value) || 0;
    
    // Peculiaridades
    document.querySelectorAll('.peculiarity-select').forEach(select => {
        const pecId = select.getAttribute('data-pec');
        ficha.peculiarities[pecId] = parseInt(select.value) || 0;
    });
    
    // Anotações
    ficha.history = document.getElementById('history').value;
    ficha.personality = document.getElementById('personality').value;
    ficha.notes = document.getElementById('notes').value;
    
    return ficha;
}

function renderFicha(fichaData) {
    // Atualizar objeto ficha
    Object.assign(ficha, fichaData);
    
    // Informações básicas
    document.getElementById('player-name').value = ficha.playerName || '';
    document.getElementById('character-name').value = ficha.characterName || '';
    document.getElementById('level').value = ficha.level || 1;
    document.getElementById('money').value = ficha.money || 0;
    
    // Atributos
    const attrs = ['strength', 'constitution', 'dexterity', 'intelligence', 'spirit', 'linecinese'];
    attrs.forEach(attr => {
        document.getElementById(attr).value = ficha.attributes[attr]?.base || 1;
        document.getElementById(`${attr}-mod`).value = ficha.attributes[attr]?.mod || 0;
    });
    
    // Sub-atributos LIN
    for (let i = 1; i <= 4; i++) {
        const attr = ficha.linAttributes[`attr${i}`] || { base: 0, mod: 0 };
        document.getElementById(`lin-attr-${i}`).value = attr.base || 0;
        document.getElementById(`lin-mod-${i}`).value = attr.mod || 0;
    }
    
    // Afinidade
    document.getElementById('lin-affinity').value = ficha.linAffinity || '';
    
    // Status atuais
    document.getElementById('current-health').value = ficha.health?.current || 0;
    document.getElementById('current-essence').value = ficha.essence?.current || 0;
    
    // Estado
    document.getElementById('thread-state').value = ficha.threadState || 'rest';
    document.getElementById('tense-state').value = ficha.tenseState || 'stable';
    document.getElementById('tense-state-container').style.display = ficha.threadState === 'tense' ? 'block' : 'none';
    
    // Características
    document.getElementById('profession').value = ficha.profession || '';
    document.getElementById('web').value = ficha.web || '';
    document.getElementById('background').value = ficha.background || '';
    
    // Bônus
    document.getElementById('armor').value = ficha.armor || 0;
    document.getElementById('defense-bonus').value = ficha.defenseBonus || 0;
    document.getElementById('resistance-bonus').value = ficha.resistanceBonus || 0;
    document.getElementById('essence-bonus').value = ficha.essenceBonus || 0;
    
    // Reputação
    document.getElementById('rep-weavers').value = ficha.reputation?.weavers || 0;
    document.getElementById('rep-church').value = ficha.reputation?.church || 0;
    document.getElementById('rep-periphery').value = ficha.reputation?.periphery || 0;
    document.getElementById('rep-hunters').value = ficha.reputation?.hunters || 0;
    document.getElementById('rep-survivors').value = ficha.reputation?.survivors || 0;
    
    // Atualizar displays de reputação
    document.getElementById('rep-weavers-value').textContent = ficha.reputation?.weavers || 0;
    document.getElementById('rep-church-value').textContent = ficha.reputation?.church || 0;
    document.getElementById('rep-periphery-value').textContent = ficha.reputation?.periphery || 0;
    document.getElementById('rep-hunters-value').textContent = ficha.reputation?.hunters || 0;
    document.getElementById('rep-survivors-value').textContent = ficha.reputation?.survivors || 0;
    
    // Peculiaridades
    if (ficha.peculiarities) {
        for (const [pecId, value] of Object.entries(ficha.peculiarities)) {
            const select = document.querySelector(`.peculiarity-select[data-pec="${pecId}"]`);
            if (select) select.value = value;
        }
    }
    
    // Anotações
    document.getElementById('history').value = ficha.history || '';
    document.getElementById('personality').value = ficha.personality || '';
    document.getElementById('notes').value = ficha.notes || '';
    
    // Atualizar cálculos
    updateCalculations();
    updateGeneralReputation();
    updateLinGrades();
}

function renderCalculatedValues() {
    // Vida
    const healthPercent = ficha.health.max > 0 ? (ficha.health.current / ficha.health.max) * 100 : 0;
    document.getElementById('health-value').textContent = ficha.health.current;
    document.getElementById('health-text').textContent = `${ficha.health.current}/${ficha.health.max}`;
    document.getElementById('health-bar').style.width = `${healthPercent}%`;
    
    // Cor da barra de vida
    const healthBar = document.getElementById('health-bar');
    if (healthPercent > 50) {
        healthBar.style.background = 'linear-gradient(90deg, #2ed573, #27ae60)';
    } else if (healthPercent > 25) {
        healthBar.style.background = 'linear-gradient(90deg, #ffa502, #f39c12)';
    } else {
        healthBar.style.background = 'linear-gradient(90deg, #ff4757, #e74c3c)';
    }
    
    // Estado morrendo
    const healthCard = document.getElementById('health-card');
    if (ficha.health.current === 0) {
        healthCard.classList.add('dying');
    } else {
        healthCard.classList.remove('dying');
    }
    
    // Essência
    const essencePercent = ficha.essence.max > 0 ? (ficha.essence.current / ficha.essence.max) * 100 : 0;
    document.getElementById('essence-value').textContent = ficha.essence.current;
    document.getElementById('essence-text').textContent = `${ficha.essence.current}/${ficha.essence.max}`;
    document.getElementById('essence-bar').style.width = `${essencePercent}%`;
    
    // Outros status calculados
    document.getElementById('defense-value').textContent = calculateDefense();
    document.getElementById('resistance-value').textContent = calculateResistance();
    document.getElementById('initiative-value').textContent = `d100 + ${calculateInitiative().toFixed(1)}`;
    
    // Capacidade
    const capacity = calculateCapacity();
    document.getElementById('capacity').textContent = capacity;
    document.getElementById('max-slots').textContent = capacity;
    
    // Pontos LIN
    const availableLinPoints = calculateAvailableLinPoints();
    document.getElementById('lin-points-available').textContent = availableLinPoints;
    
    // Mostrar/ocultar seção LIN
    const section = document.getElementById('lin-subattributes-section');
    const linecinese = calculateTotalAttribute('linecinese');
    section.style.display = linecinese > 0 ? 'block' : 'none';
}

function updateLinGrades() {
    for (let i = 1; i <= 4; i++) {
        const attr = ficha.linAttributes[`attr${i}`] || { base: 0, mod: 0 };
        const total = attr.base + attr.mod;
        document.getElementById(`lin-grade-${i}`).textContent = calculateLinGrade(total);
    }
}

function updateGeneralReputation() {
    const total = Object.values(ficha.reputation).reduce((sum, val) => sum + val, 0);
    document.getElementById('general-reputation').textContent = total;
    
    const generalRep = document.getElementById('general-reputation');
    if (total > 0) {
        generalRep.style.color = 'var(--success)';
    } else if (total < 0) {
        generalRep.style.color = 'var(--danger)';
    } else {
        generalRep.style.color = 'var(--accent)';
    }
}

// ========== FUNÇÕES DE SISTEMA ==========
function changeHealth(action) {
    const input = document.getElementById('health-change-input');
    const changeValue = parseInt(input.value) || 1;
    
    if (action === 'add') {
        ficha.health.current += changeValue;
    } else if (action === 'sub') {
        ficha.health.current -= changeValue;
        
        // Verificar dano crítico
        if (changeValue > ficha.health.max / 2) {
            ficha.health.current = 0;
            alert("⚰️ VOCÊ TOMOU MAIS DA METADE DA SUA VIDA EM UM ÚNICO ATAQUE!\n\nESTADO: MORRENDO!");
        }
    }
    
    if (ficha.health.current < 0) ficha.health.current = 0;
    if (ficha.health.current > ficha.health.max) ficha.health.current = ficha.health.max;
    
    document.getElementById('current-health').value = ficha.health.current;
    renderCalculatedValues();
}

function changeEssence(action) {
    const input = document.getElementById('essence-change-input');
    const changeValue = parseInt(input.value) || 1;
    
    if (action === 'add') {
        ficha.essence.current += changeValue;
    } else if (action === 'sub') {
        ficha.essence.current -= changeValue;
    }
    
    if (ficha.essence.current < 0) ficha.essence.current = 0;
    if (ficha.essence.current > ficha.essence.max) ficha.essence.current = ficha.essence.max;
    
    document.getElementById('current-essence').value = ficha.essence.current;
    renderCalculatedValues();
}

function applyAffinity() {
    if (!ficha.linAffinity) return;
    
    const config = affinityMap[ficha.linAffinity];
    
    // Resetar modificadores de afinidade
    for (let i = 1; i <= 4; i++) {
        ficha.linAttributes[`attr${i}`].mod = 0;
    }
    
    // Aplicar bônus/penalidade
    ficha.linAttributes[`attr${config.advantage}`].mod = 5;
    ficha.linAttributes[`attr${config.disadvantage}`].mod = -5;
    
    renderFicha(ficha);
}

// ========== INVENTÁRIO ==========
function updateInventorySlots() {
    const items = document.querySelectorAll('#inventory-container .inventory-item');
    let slotsUsed = 0;
    
    items.forEach(item => {
        const slotInput = item.querySelector('.item-slots-input');
        if (slotInput) {
            slotsUsed += parseInt(slotInput.value) || 1;
        }
    });
    
    const capacity = calculateCapacity();
    const available = Math.max(0, capacity - slotsUsed);
    
    document.getElementById('used-slots').textContent = slotsUsed;
    document.getElementById('available-slots').textContent = available;
    
    // Verificar sobrepeso
    isOverweight = slotsUsed > capacity;
    const warning = document.getElementById('overweight-warning');
    
    if (isOverweight) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
    
    inventorySlotsUsed = slotsUsed;
}

function addItem() {
    const container = document.getElementById('inventory-container');
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 2fr 0.5fr; gap: 15px; width: 100%; align-items: center;">
            <div>
                <input type="text" placeholder="Nome do Item" class="item-name-input" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
            </div>
            <div>
                <input type="number" class="item-slots-input" placeholder="Slots" min="1" value="1" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
            </div>
            <div>
                <select class="item-type-select" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
                    <option value="item">Item</option>
                    <option value="weapon">Arma</option>
                </select>
            </div>
            <div>
                <textarea placeholder="Descrição" rows="1" class="item-desc-input" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); color: var(--text); border-radius: 5px;"></textarea>
            </div>
            <div>
                <button class="btn-remove" onclick="this.parentElement.parentElement.parentElement.remove(); updateInventorySlots();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    const slotsInput = itemDiv.querySelector('.item-slots-input');
    if (slotsInput) {
        slotsInput.addEventListener('input', updateInventorySlots);
    }
    
    updateInventorySlots();
}

// ========== HABILIDADES ==========
function addAbility() {
    const container = document.getElementById('abilities-container');
    
    const abilityDiv = document.createElement('div');
    abilityDiv.className = 'ability-item';
    abilityDiv.innerHTML = `
        <div class="ability-header">
            <input type="text" placeholder="Nome" style="width: 300px; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;"">
            <select style="width: 100px; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
                <option value="passive">Passiva</option>
                <option value="active">Ativa</option>
            </select>
        </div>
        <div style="grid-column: span 2;">
            <textarea placeholder="Descrição" rows="3" style="width: 100%; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;"></textarea>
        </div>
        <div>
            <button class="btn-remove" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(abilityDiv);
}

// ========== FIREBASE INTEGRATION ==========
async function saveToFirebase() {
    try {
        // Obter dados do DOM
        getFichaFromDOM();
        
        // Verificar autenticação
        if (!FirebaseService.isAuthenticated()) {
            const authResult = await showAuthDialog();
            if (!authResult) {
                saveToLocalStorage();
                return;
            }
        }
        
        // Salvar no Firestore
        const result = await FirebaseService.saveFicha(ficha, currentCharacterId);
        
        if (result.success) {
            currentCharacterId = result.characterId;
            showNotification('✅ Ficha salva na nuvem!', 'success');
            
            // Backup local
            saveToLocalStorage();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showNotification(`❌ Erro: ${error.message}`, 'error');
        saveToLocalStorage(); // Fallback
    }
}

async function loadFromFirebase(characterId = null) {
    try {
        // Verificar autenticação
        if (!FirebaseService.isAuthenticated()) {
            const authResult = await showAuthDialog();
            if (!authResult) {
                loadFromLocalStorage();
                return;
            }
        }
        
        // Se não tem characterId, mostrar lista
        if (!characterId) {
            await showCharacterList();
            return;
        }
        
        // Carregar ficha específica
        const result = await FirebaseService.loadFicha(characterId);
        
        if (result.success) {
            currentCharacterId = result.id;
            renderFicha(result.data);
            showNotification('✅ Ficha carregada!', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        showNotification(`❌ Erro: ${error.message}`, 'error');
        loadFromLocalStorage(); // Fallback
    }
}

async function showCharacterList() {
    const result = await FirebaseService.loadAllFichas();
    
    if (result.success && result.fichas.length > 0) {
        // Criar modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center;
            align-items: center; z-index: 10000;
        `;
        
        let listHTML = result.fichas.map(ficha => `
            <div class="character-item" style="padding: 15px; border-bottom: 1px solid var(--border); cursor: pointer; margin-bottom: 10px; border-radius: 8px; background: rgba(255,255,255,0.05);" data-id="${ficha.id}">
                <div style="font-weight: bold; color: var(--accent);">${ficha.characterName || 'Sem nome'}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                    Nível ${ficha.level || 1} • Criado: ${ficha.createdAt ? new Date(ficha.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </div>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div style="background: var(--card-bg); padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: var(--accent); margin-bottom: 20px;">Seus Personagens</h2>
                <div id="character-list">
                    ${listHTML}
                </div>
                <button id="close-list" style="width: 100%; padding: 12px; margin-top: 20px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 5px; cursor: pointer;">
                    Fechar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelectorAll('.character-item').forEach(item => {
            item.addEventListener('click', () => {
                const characterId = item.getAttribute('data-id');
                document.body.removeChild(modal);
                loadFromFirebase(characterId);
            });
        });
        
        document.getElementById('close-list').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    } else {
        showNotification('Nenhum personagem encontrado', 'info');
    }
}

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
                
                <button id="auth-google" style="width: 100%; padding: 12px; background: #4285F4; color: white; border: none; border-radius: 5px; margin-bottom: 15px; cursor: pointer;">
                    <i class="fab fa-google"></i> Login com Google
                </button>
                
                <button id="auth-cancel" style="width: 100%; padding: 12px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 5px; cursor: pointer;">
                    Cancelar
                </button>
                
                <div id="auth-error" style="color: var(--danger); margin-top: 15px; display: none;"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
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
        
        document.getElementById('auth-google').addEventListener('click', async () => {
            const result = await FirebaseService.loginWithGoogle();
            handleAuthResult(result);
        });
        
        document.getElementById('auth-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
        });
        
        function handleAuthResult(result) {
            if (result.success) {
                document.body.removeChild(modal);
                showNotification('Login realizado!', 'success');
                resolve(true);
            } else {
                const errorEl = document.getElementById('auth-error');
                errorEl.textContent = result.error;
                errorEl.style.display = 'block';
            }
        }
    });
}

async function logout() {
    const result = await FirebaseService.logout();
    if (result.success) {
        currentCharacterId = null;
        showNotification('Logout realizado', 'success');
        document.getElementById('logout-btn').style.display = 'none';
    }
}

// ========== LOCALSTORAGE (fallback) ==========
function saveToLocalStorage() {
    getFichaFromDOM();
    localStorage.setItem('ficha_local_backup', JSON.stringify(ficha));
    showNotification('Ficha salva localmente (backup)', 'info');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('ficha_local_backup');
    if (saved) {
        const fichaData = JSON.parse(saved);
        renderFicha(fichaData);
        showNotification('Ficha carregada do backup local', 'info');
    } else {
        showNotification('Nenhum backup local encontrado', 'error');
    }
}

// ========== UTILITIES ==========
function showNotification(message, type = 'info') {
    // Remove notificação anterior se existir
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent)'};
        color: white; border-radius: 8px; z-index: 10001;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar peculiaridades
    initPeculiarities();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar Firebase auth state
    FirebaseService.onAuthStateChanged((user) => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.style.display = user ? 'block' : 'none';
        }
        
        if (user) {
            console.log('Usuário autenticado:', user.email);
        }
    });
    
    // Renderizar estado inicial
    updateCalculations();
    updateInventorySlots();
    
    // Tentar carregar do localStorage
    setTimeout(() => {
        loadFromLocalStorage();
    }, 500);
});

function initPeculiarities() {
    const container = document.getElementById('peculiarities-container');
    container.innerHTML = '';
    
    peculiaritiesList.forEach(pec => {
        const div = document.createElement('div');
        div.className = 'peculiarity-item';
        div.innerHTML = `
            <div class="peculiarity-name">${pec.name}</div>
            <select class="peculiarity-select" data-pec="${pec.id}" style="width: 180px;">
                <option value="0">Não Treinado (+0)</option>
                <option value="5">Treinado (+5)</option>
                <option value="10">Especialista (+10)</option>
                <option value="15">Mestre (+15)</option>
            </select>
        `;
        container.appendChild(div);
    });
}

function setupEventListeners() {
    // Atributos principais
    document.querySelectorAll('.attr-input').forEach(input => {
        input.addEventListener('input', updateCalculations);
    });
    
    // Modificadores
    document.querySelectorAll('.modifier-input').forEach(input => {
        input.addEventListener('input', updateCalculations);
    });
    
    // Sub-atributos LIN
    document.querySelectorAll('.lin-attr-input, .lin-mod-input').forEach(input => {
        input.addEventListener('input', () => {
            getFichaFromDOM();
            updateCalculations();
            updateLinGrades();
        });
    });
    
    // Afinidade
    document.getElementById('lin-affinity').addEventListener('change', function() {
        ficha.linAffinity = this.value;
        if (ficha.linAffinity) {
            applyAffinity();
        }
    });
    
    // Estado do Fio
    document.getElementById('thread-state').addEventListener('change', function() {
        const tenseContainer = document.getElementById('tense-state-container');
        tenseContainer.style.display = this.value === 'tense' ? 'block' : 'none';
    });
    
    // Vida atual
    document.getElementById('current-health').addEventListener('input', function() {
        ficha.health.current = parseInt(this.value) || 0;
        updateCalculations();
    });
    
    // Essência atual
    document.getElementById('current-essence').addEventListener('input', function() {
        ficha.essence.current = parseInt(this.value) || 0;
        updateCalculations();
    });
    
    // Sliders de reputação
    document.querySelectorAll('.reputation-slider').forEach(slider => {
        slider.addEventListener('input', function() {
            const repId = this.id.replace('rep-', '');
            ficha.reputation[repId] = parseInt(this.value) || 0;
            document.getElementById(`${this.id}-value`).textContent = this.value;
            updateGeneralReputation();
        });
    });
    
    // Inputs de bônus
    const bonusInputs = ['armor', 'defense-bonus', 'resistance-bonus', 'essence-bonus', 'level'];
    bonusInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateCalculations);
    });
    
    // Botões de saúde
    document.querySelectorAll('.health-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent === '+' ? 'add' : 'sub';
            if (this.parentElement.classList.contains('health-buttons')) {
                const type = this.parentElement.parentElement.querySelector('.health-input-container input').id.includes('health') ? 'health' : 'essence';
                if (type === 'health') changeHealth(action);
                else changeEssence(action);
            }
        });
    });
}

// Adicionar CSS para animação da notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Exportar para uso global (se necessário)
window.ficha = ficha;
window.FirebaseService = FirebaseService;
window.saveToFirebase = saveToFirebase;
window.loadFromFirebase = loadFromFirebase;
window.showCharacterList = showCharacterList;
window.logout = logout;
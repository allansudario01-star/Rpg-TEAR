// ========== CONFIGURAÇÕES E CONSTANTES ==========

// Lista de peculiaridades
const PECULIARITIES = [
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

// Mapa de afinidade
const AFFINITY_MAP = {
    1: { advantage: 1, disadvantage: 2, bonus: 5, penalty: -5 },
    2: { advantage: 2, disadvantage: 3, bonus: 5, penalty: -5 },
    3: { advantage: 3, disadvantage: 4, bonus: 5, penalty: -5 },
    4: { advantage: 4, disadvantage: 1, bonus: 5, penalty: -5 }
};

// ========== ESTADO GLOBAL ==========

let currentCharacterId = null;
let isOverweight = false;
let inventorySlotsUsed = 0;
let listenersConfigured = false;

// Objeto principal da ficha
const ficha = {
    playerName: '',
    characterName: '',
    level: 1,
    money: 0,
    
    attributes: {
        strength: { base: 1, mod: 0 },
        constitution: { base: 1, mod: 0 },
        dexterity: { base: 1, mod: 0 },
        intelligence: { base: 1, mod: 0 },
        spirit: { base: 1, mod: 0 },
        linecinese: { base: 1, mod: 0 }
    },
    
    linAttributes: {
        attr1: { base: 0, mod: 0 },
        attr2: { base: 0, mod: 0 },
        attr3: { base: 0, mod: 0 },
        attr4: { base: 0, mod: 0 }
    },
    
    linAffinity: null,
    health: { current: 9, max: 9 },
    essence: { current: 3, max: 3 },
    threadState: 'rest',
    tenseState: 'stable',
    profession: '',
    web: '',
    background: '',
    armor: 0,
    defenseBonus: 0,
    resistanceBonus: 0,
    essenceBonus: 0,
    
    reputation: {
        weavers: 0,
        church: 0,
        periphery: 0,
        hunters: 0,
        survivors: 0
    },
    
    peculiarities: {},
    history: '',
    personality: '',
    notes: '',
    userId: null,
    lastUpdated: null,
    createdAt: null
};

// ========== FUNÇÕES DE CÁLCULO (PURAS) ==========

function calculateTotalAttribute(attr) {
    return ficha.attributes[attr].base + ficha.attributes[attr].mod;
}

// CALCULA o máximo BASE (sem bônus temporários)
function calculateBaseMaxHealth() {
    const constitution = calculateTotalAttribute('constitution');
    const strength = calculateTotalAttribute('strength');
    return (constitution * 3) + strength + (ficha.level * 5);
}

// CALCULA o máximo BASE de essência (sem bônus temporários)
function calculateBaseMaxEssence() {
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

// ========== FUNÇÕES DE ESTADO ==========

function updateCalculations() {
    // Atualizar os máximos BASE (para exibição)
    ficha.health.max = calculateBaseMaxHealth();
    ficha.essence.max = calculateBaseMaxEssence();
    
    // NÃO LIMITAR os valores atuais! Podem ser maiores que o máximo
    // Apenas garantir que não sejam negativos
    if (ficha.health.current < 0) ficha.health.current = 0;
    if (ficha.essence.current < 0) ficha.essence.current = 0;
    
    renderCalculatedValues();
}

function resetFicha() {
    // Informações básicas
    ficha.playerName = '';
    ficha.characterName = '';
    ficha.level = 1;
    ficha.money = 0;
    
    // Atributos principais
    const attrs = ['strength', 'constitution', 'dexterity', 'intelligence', 'spirit', 'linecinese'];
    attrs.forEach(attr => {
        ficha.attributes[attr] = { base: 1, mod: 0 };
    });
    
    // Sub-atributos LIN
    for (let i = 1; i <= 4; i++) {
        ficha.linAttributes[`attr${i}`] = { base: 0, mod: 0 };
    }
    
    // Status (começa no máximo base)
    const baseHealth = calculateBaseMaxHealth();
    const baseEssence = calculateBaseMaxEssence();
    
    ficha.health = { current: baseHealth, max: baseHealth };
    ficha.essence = { current: baseEssence, max: baseEssence };
    
    // Estado
    ficha.threadState = 'rest';
    ficha.tenseState = 'stable';
    ficha.linAffinity = null;
    
    // Características
    ficha.profession = '';
    ficha.web = '';
    ficha.background = '';
    
    // Bônus
    ficha.armor = 0;
    ficha.defenseBonus = 0;
    ficha.resistanceBonus = 0;
    ficha.essenceBonus = 0;
    
    // Reputação
    ficha.reputation = {
        weavers: 0,
        church: 0,
        periphery: 0,
        hunters: 0,
        survivors: 0
    };
    
    // Peculiaridades
    PECULIARITIES.forEach(pec => {
        ficha.peculiarities[pec.id] = 0;
    });
    
    // Anotações
    ficha.history = '';
    ficha.personality = '';
    ficha.notes = '';
    
    // Limpar ID atual
    currentCharacterId = null;
    // localStorage.removeItem('currentCharacterId');
    
    console.log("Ficha resetada para valores padrão!");
}

// ========== FUNÇÕES DE INTERFACE ==========

function getFichaFromDOM() {
    // Informações básicas
    ficha.playerName = document.getElementById('player-name').value;
    ficha.characterName = document.getElementById('character-name').value;
    ficha.level = parseInt(document.getElementById('level').value) || 1;
    ficha.money = parseInt(document.getElementById('money').value) || 0;
    
    // Atributos principais
    const attrs = ['strength', 'constitution', 'dexterity', 'intelligence', 'spirit', 'linecinese'];
    attrs.forEach(attr => {
        const baseInput = document.getElementById(attr);
        const modInput = document.getElementById(`${attr}-mod`);
        
        if (baseInput) ficha.attributes[attr].base = parseInt(baseInput.value) || 1;
        if (modInput) ficha.attributes[attr].mod = parseInt(modInput.value) || 0;
    });
    
    // Sub-atributos LIN
    for (let i = 1; i <= 4; i++) {
        const baseInput = document.getElementById(`lin-attr-${i}`);
        const modInput = document.getElementById(`lin-mod-${i}`);
        
        if (baseInput) ficha.linAttributes[`attr${i}`].base = parseInt(baseInput.value) || 0;
        if (modInput) ficha.linAttributes[`attr${i}`].mod = parseInt(modInput.value) || 0;
    }
    
    // Afinidade
    const affinitySelect = document.getElementById('lin-affinity');
    if (affinitySelect) ficha.linAffinity = affinitySelect.value || null;
    
    // Status atuais
    const currentHealth = document.getElementById('current-health');
    const currentEssence = document.getElementById('current-essence');
    if (currentHealth) ficha.health.current = parseInt(currentHealth.value) || 0;
    if (currentEssence) ficha.essence.current = parseInt(currentEssence.value) || 0;
    
    // Estado do Fio
    const threadState = document.getElementById('thread-state');
    const tenseState = document.getElementById('tense-state');
    if (threadState) ficha.threadState = threadState.value;
    if (tenseState) ficha.tenseState = tenseState.value;
    
    // Características
    const profession = document.getElementById('profession');
    const web = document.getElementById('web');
    const background = document.getElementById('background');
    if (profession) ficha.profession = profession.value;
    if (web) ficha.web = web.value;
    if (background) ficha.background = background.value;
    
    // Bônus
    const armor = document.getElementById('armor');
    const defenseBonus = document.getElementById('defense-bonus');
    const resistanceBonus = document.getElementById('resistance-bonus');
    const essenceBonus = document.getElementById('essence-bonus');
    if (armor) ficha.armor = parseInt(armor.value) || 0;
    if (defenseBonus) ficha.defenseBonus = parseInt(defenseBonus.value) || 0;
    if (resistanceBonus) ficha.resistanceBonus = parseInt(resistanceBonus.value) || 0;
    if (essenceBonus) ficha.essenceBonus = parseInt(essenceBonus.value) || 0;
    
    // Reputação
    const reputations = ['weavers', 'church', 'periphery', 'hunters', 'survivors'];
    reputations.forEach(rep => {
        const slider = document.getElementById(`rep-${rep}`);
        if (slider) ficha.reputation[rep] = parseInt(slider.value) || 0;
    });
    
    // Peculiaridades
    document.querySelectorAll('.peculiarity-select').forEach(select => {
        const pecId = select.getAttribute('data-pec');
        ficha.peculiarities[pecId] = parseInt(select.value) || 0;
    });
    
    // Anotações
    const history = document.getElementById('history');
    const personality = document.getElementById('personality');
    const notes = document.getElementById('notes');
    if (history) ficha.history = history.value;
    if (personality) ficha.personality = personality.value;
    if (notes) ficha.notes = notes.value;
    
    return ficha;
}

function renderFicha(fichaData) {
    Object.assign(ficha, fichaData);
    
    // Informações básicas
    const playerName = document.getElementById('player-name');
    const characterName = document.getElementById('character-name');
    const level = document.getElementById('level');
    const money = document.getElementById('money');
    if (playerName) playerName.value = ficha.playerName || '';
    if (characterName) characterName.value = ficha.characterName || '';
    if (level) level.value = ficha.level || 1;
    if (money) money.value = ficha.money || 0;
    
    // Atributos principais
    const attrs = ['strength', 'constitution', 'dexterity', 'intelligence', 'spirit', 'linecinese'];
    attrs.forEach(attr => {
        const baseInput = document.getElementById(attr);
        const modInput = document.getElementById(`${attr}-mod`);
        if (baseInput) baseInput.value = ficha.attributes[attr]?.base || 1;
        if (modInput) modInput.value = ficha.attributes[attr]?.mod || 0;
    });
    
    // Sub-atributos LIN
    for (let i = 1; i <= 4; i++) {
        const attr = ficha.linAttributes[`attr${i}`] || { base: 0, mod: 0 };
        const baseInput = document.getElementById(`lin-attr-${i}`);
        const modInput = document.getElementById(`lin-mod-${i}`);
        if (baseInput) baseInput.value = attr.base || 0;
        if (modInput) modInput.value = attr.mod || 0;
    }
    
    // Afinidade
    const affinitySelect = document.getElementById('lin-affinity');
    if (affinitySelect) affinitySelect.value = ficha.linAffinity || '';
    
    // Status atuais
    const currentHealth = document.getElementById('current-health');
    const currentEssence = document.getElementById('current-essence');
    if (currentHealth) currentHealth.value = ficha.health?.current || 0;
    if (currentEssence) currentEssence.value = ficha.essence?.current || 0;
    
    // Estado do Fio
    const threadState = document.getElementById('thread-state');
    const tenseState = document.getElementById('tense-state');
    const tenseContainer = document.getElementById('tense-state-container');
    if (threadState) threadState.value = ficha.threadState || 'rest';
    if (tenseState) tenseState.value = ficha.tenseState || 'stable';
    if (tenseContainer) {
        tenseContainer.style.display = ficha.threadState === 'tense' ? 'block' : 'none';
    }
    
    // Características
    const profession = document.getElementById('profession');
    const web = document.getElementById('web');
    const background = document.getElementById('background');
    if (profession) profession.value = ficha.profession || '';
    if (web) web.value = ficha.web || '';
    if (background) background.value = ficha.background || '';
    
    // Bônus
    const armor = document.getElementById('armor');
    const defenseBonus = document.getElementById('defense-bonus');
    const resistanceBonus = document.getElementById('resistance-bonus');
    const essenceBonus = document.getElementById('essence-bonus');
    if (armor) armor.value = ficha.armor || 0;
    if (defenseBonus) defenseBonus.value = ficha.defenseBonus || 0;
    if (resistanceBonus) resistanceBonus.value = ficha.resistanceBonus || 0;
    if (essenceBonus) essenceBonus.value = ficha.essenceBonus || 0;
    
    // Reputação
    const reputations = ['weavers', 'church', 'periphery', 'hunters', 'survivors'];
    reputations.forEach(rep => {
        const slider = document.getElementById(`rep-${rep}`);
        const valueDisplay = document.getElementById(`rep-${rep}-value`);
        if (slider) slider.value = ficha.reputation?.[rep] || 0;
        if (valueDisplay) valueDisplay.textContent = ficha.reputation?.[rep] || 0;
    });
    
    // Peculiaridades
    if (ficha.peculiarities) {
        for (const [pecId, value] of Object.entries(ficha.peculiarities)) {
            const select = document.querySelector(`.peculiarity-select[data-pec="${pecId}"]`);
            if (select) select.value = value;
        }
    }
    
    // Anotações
    const history = document.getElementById('history');
    const personality = document.getElementById('personality');
    const notes = document.getElementById('notes');
    if (history) history.value = ficha.history || '';
    if (personality) personality.value = ficha.personality || '';
    if (notes) notes.value = ficha.notes || '';
    
    updateCalculations();
    updateGeneralReputation();
    updateLinGrades();
}

function renderCalculatedValues() {
    // Vida - mostrar ATUAL / MÁXIMO BASE
    const healthValue = document.getElementById('health-value');
    const healthText = document.getElementById('health-text');
    const healthBar = document.getElementById('health-bar');
    
    // Calcular porcentagem baseada no máximo (mas pode mostrar >100%)
    const healthPercent = ficha.health.max > 0 ? (ficha.health.current / ficha.health.max) * 100 : 0;
    
    if (healthValue) healthValue.textContent = ficha.health.current;
    if (healthText) healthText.textContent = `${ficha.health.current} / ${ficha.health.max}`;
    
    // Barra de vida - se >100%, mostrar cheia com efeito especial
    if (healthBar) {
        if (healthPercent <= 100) {
            healthBar.style.width = `${healthPercent}%`;
        } else {
            // Se tiver mais que 100%, mostrar barra cheia com efeito
            healthBar.style.width = '100%';
            healthBar.style.background = 'linear-gradient(90deg, #2ed573, #27ae60, #00d4ff)';
            healthBar.style.backgroundSize = '200% 100%';
            healthBar.style.animation = 'pulse 2s infinite';
        }
        
        // Cor normal da barra (só se não estiver com bônus)
        if (healthPercent <= 100) {
            if (healthPercent > 50) {
                healthBar.style.background = 'linear-gradient(90deg, #2ed573, #27ae60)';
            } else if (healthPercent > 25) {
                healthBar.style.background = 'linear-gradient(90deg, #ffa502, #f39c12)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #ff4757, #e74c3c)';
            }
        }
    }
    
    // Estado morrendo (só se for 0)
    const healthCard = document.getElementById('health-card');
    if (healthCard) {
        if (ficha.health.current === 0) {
            healthCard.classList.add('dying');
        } else {
            healthCard.classList.remove('dying');
        }
    }
    
    // Essência - mostrar ATUAL / MÁXIMO BASE
    const essenceValue = document.getElementById('essence-value');
    const essenceText = document.getElementById('essence-text');
    const essenceBar = document.getElementById('essence-bar');
    
    // Calcular porcentagem baseada no máximo (mas pode mostrar >100%)
    const essencePercent = ficha.essence.max > 0 ? (ficha.essence.current / ficha.essence.max) * 100 : 0;
    
    if (essenceValue) essenceValue.textContent = ficha.essence.current;
    if (essenceText) essenceText.textContent = `${ficha.essence.current} / ${ficha.essence.max}`;
    
    // Barra de essência - se >100%, mostrar cheia com efeito especial
    if (essenceBar) {
        if (essencePercent <= 100) {
            essenceBar.style.width = `${essencePercent}%`;
            essenceBar.style.background = 'linear-gradient(90deg, #00d4ff, #0097cc)';
        } else {
            // Se tiver mais que 100%, mostrar barra cheia com efeito
            essenceBar.style.width = '100%';
            essenceBar.style.background = 'linear-gradient(90deg, #00d4ff, #0097cc, #ff00ff)';
            essenceBar.style.backgroundSize = '200% 100%';
            essenceBar.style.animation = 'pulse 2s infinite';
        }
    }
    
    // Outros status calculados
    const defenseValue = document.getElementById('defense-value');
    const resistanceValue = document.getElementById('resistance-value');
    const initiativeValue = document.getElementById('initiative-value');
    const capacity = document.getElementById('capacity');
    const maxSlots = document.getElementById('max-slots');
    const linPoints = document.getElementById('lin-points-available');
    const linSection = document.getElementById('lin-subattributes-section');
    
    if (defenseValue) defenseValue.textContent = calculateDefense();
    if (resistanceValue) resistanceValue.textContent = calculateResistance();
    if (initiativeValue) initiativeValue.textContent = `d100 + ${calculateInitiative().toFixed(1)}`;
    
    const capValue = calculateCapacity();
    if (capacity) capacity.textContent = capValue;
    if (maxSlots) maxSlots.textContent = capValue;
    
    if (linPoints) linPoints.textContent = calculateAvailableLinPoints();
    
    // Mostrar/ocultar seção LIN
    if (linSection) {
        const linecinese = calculateTotalAttribute('linecinese');
        linSection.style.display = linecinese > 0 ? 'block' : 'none';
    }
    
    // Adicionar classe especial se tiver bônus
    const healthContainer = document.querySelector('.status-card#health-card');
    const essenceContainer = document.querySelector('.status-card#essence-card');
    
    if (healthContainer) {
        if (ficha.health.current > ficha.health.max) {
            healthContainer.classList.add('over-max');
        } else {
            healthContainer.classList.remove('over-max');
        }
    }
    
    if (essenceContainer) {
        if (ficha.essence.current > ficha.essence.max) {
            essenceContainer.classList.add('over-max');
        } else {
            essenceContainer.classList.remove('over-max');
        }
    }
}

function updateLinGrades() {
    for (let i = 1; i <= 4; i++) {
        const attr = ficha.linAttributes[`attr${i}`] || { base: 0, mod: 0 };
        const total = attr.base + attr.mod;
        const gradeElement = document.getElementById(`lin-grade-${i}`);
        if (gradeElement) gradeElement.textContent = calculateLinGrade(total);
    }
}

function updateGeneralReputation() {
    const total = Object.values(ficha.reputation).reduce((sum, val) => sum + val, 0);
    const generalRep = document.getElementById('general-reputation');
    
    if (generalRep) {
        generalRep.textContent = total;
        
        if (total > 0) {
            generalRep.style.color = 'var(--success)';
        } else if (total < 0) {
            generalRep.style.color = 'var(--danger)';
        } else {
            generalRep.style.color = 'var(--accent)';
        }
    }
}

// ========== FUNÇÕES DE SISTEMA (COM BÔNUS TEMPORÁRIOS) ==========

function changeHealth(action) {
    const input = document.getElementById('health-change-input');
    const changeValue = parseInt(input?.value) || 1;
    
    if (action === 'add') {
        ficha.health.current += changeValue;
        console.log(`Cura aplicada: ${changeValue}. Vida atual: ${ficha.health.current} / Máx Base: ${ficha.health.max}`);
    } else if (action === 'sub') {
        ficha.health.current -= changeValue;
        console.log(`Dano aplicado: ${changeValue}. Vida atual: ${ficha.health.current} / Máx Base: ${ficha.health.max}`);
        
        // Verificar dano crítico (50% do máximo BASE)
        if (changeValue > ficha.health.max / 2) {
            ficha.health.current = 0;
            alert("⚰️ VOCÊ TOMOU MAIS DA METADE DA SUA VIDA MÁXIMA EM UM ÚNICO ATAQUE!\n\nESTADO: MORRENDO!");
        }
    }
    
    // Apenas garantir que não fique negativo
    // PODE FICAR ACIMA DO MÁXIMO!
    if (ficha.health.current < 0) ficha.health.current = 0;
    
    const currentHealthInput = document.getElementById('current-health');
    if (currentHealthInput) currentHealthInput.value = ficha.health.current;
    
    updateCalculations();
}

function changeEssence(action) {
    const input = document.getElementById('essence-change-input');
    const changeValue = parseInt(input?.value) || 1;
    
    if (action === 'add') {
        ficha.essence.current += changeValue;
        console.log(`Essência restaurada: ${changeValue}. Essência atual: ${ficha.essence.current} / Máx Base: ${ficha.essence.max}`);
    } else if (action === 'sub') {
        ficha.essence.current -= changeValue;
        console.log(`Essência consumida: ${changeValue}. Essência atual: ${ficha.essence.current} / Máx Base: ${ficha.essence.max}`);
    }
    
    // Apenas garantir que não fique negativo
    // PODE FICAR ACIMA DO MÁXIMO!
    if (ficha.essence.current < 0) ficha.essence.current = 0;
    
    const currentEssenceInput = document.getElementById('current-essence');
    if (currentEssenceInput) currentEssenceInput.value = ficha.essence.current;
    
    updateCalculations();
}

// ========== FUNÇÕES DE BÔNUS TEMPORÁRIOS ==========

/**
 * Aplica um bônus temporário de vida
 * @param {number} amount - Quantidade de vida extra
 * @param {string} source - Fonte do bônus (ex: "poção", "magia", "item")
 */
function addTemporaryHealth(amount, source = "bônus") {
    const oldHealth = ficha.health.current;
    ficha.health.current += amount;
    
    console.log(`${source}: +${amount} vida. ${oldHealth} → ${ficha.health.current}`);
    showNotification(`+${amount} vida temporária (${source})`, 'success');
    
    updateCalculations();
}

/**
 * Aplica um bônus temporário de essência
 * @param {number} amount - Quantidade de essência extra
 * @param {string} source - Fonte do bônus (ex: "poção", "magia", "item")
 */
function addTemporaryEssence(amount, source = "bônus") {
    const oldEssence = ficha.essence.current;
    ficha.essence.current += amount;
    
    console.log(`${source}: +${amount} essência. ${oldEssence} → ${ficha.essence.current}`);
    showNotification(`+${amount} essência temporária (${source})`, 'success');
    
    updateCalculations();
}

/**
 * Remove TODOS os bônus temporários, voltando ao máximo base
 */
function clearTemporaryBonuses() {
    const hadBonusHealth = ficha.health.current > ficha.health.max;
    const hadBonusEssence = ficha.essence.current > ficha.essence.max;
    
    // Reduzir para o máximo base se estiver acima
    if (ficha.health.current > ficha.health.max) {
        console.log(`Removendo bônus de vida: ${ficha.health.current} → ${ficha.health.max}`);
        ficha.health.current = ficha.health.max;
    }
    
    if (ficha.essence.current > ficha.essence.max) {
        console.log(`Removendo bônus de essência: ${ficha.essence.current} → ${ficha.essence.max}`);
        ficha.essence.current = ficha.essence.max;
    }
    
    if (hadBonusHealth || hadBonusEssence) {
        showNotification("Bônus temporários removidos", 'info');
    }
    
    updateCalculations();
}

function applyAffinity() {
    if (!ficha.linAffinity) return;
    
    const config = AFFINITY_MAP[ficha.linAffinity];
    
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
    
    const usedSlots = document.getElementById('used-slots');
    const availableSlots = document.getElementById('available-slots');
    const warning = document.getElementById('overweight-warning');
    
    if (usedSlots) usedSlots.textContent = slotsUsed;
    if (availableSlots) availableSlots.textContent = available;
    
    isOverweight = slotsUsed > capacity;
    if (warning) {
        warning.style.display = isOverweight ? 'block' : 'none';
    }
    
    inventorySlotsUsed = slotsUsed;
}

function addItem() {
    const container = document.getElementById('inventory-container');
    if (!container) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 2fr 0.5fr; gap: 15px; width: 100%; align-items: center;">
            <div>
                <input type="text" placeholder="Nome do Item" class="item-name-input" style="width: 100%; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
            </div>
            <div>
                <input type="number" class="item-slots-input" placeholder="Slots" min="1" value="1" style="width: 100%; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
            </div>
            <div>
                <select class="item-type-select" style="width: 100%; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
                    <option value="item">Item</option>
                    <option value="weapon">Arma</option>
                </select>
            </div>
            <div>
                <textarea placeholder="Descrição" rows="1" class="item-desc-input" style="width: 100%; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;"></textarea>
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
    if (!container) return;
    
    const abilityDiv = document.createElement('div');
    abilityDiv.className = 'ability-item';
    abilityDiv.innerHTML = `
        <div class="ability-header">
            <input type="text" placeholder="Nome" style="width: 300px; padding: 10px; background: var(--secondary); border: 1px solid var(--border); color: var(--text); border-radius: 5px;">
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
        getFichaFromDOM();
        
        if (!FirebaseService.isAuthenticated()) {
            const authResult = await showAuthDialog();
            if (!authResult) return;
        }
        
        const result = await FirebaseService.saveFicha(ficha, currentCharacterId);
        
        if (result.success) {
            currentCharacterId = result.characterId;
            showNotification('✅ Ficha salva na nuvem!', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showNotification(`❌ Erro: ${error.message}`, 'error');
    }
}

async function loadFromFirebase(characterId = null) {
    try {
        if (!FirebaseService.isAuthenticated()) {
            const authResult = await showAuthDialog();
            if (!authResult) return;
        }
        
        if (!characterId) {
            await showCharacterList();
            return;
        }
        
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
    }
}

async function showCharacterList() {
    const result = await FirebaseService.loadAllFichas();
    
    if (result.success && result.fichas.length > 0) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center;
            align-items: center; z-index: 10000;
        `;
        
        let listHTML = result.fichas.map(f => `
            <div class="character-item" style="padding: 15px; border-bottom: 1px solid var(--border); cursor: pointer; margin-bottom: 10px; border-radius: 8px; background: rgba(255,255,255,0.05);" data-id="${f.id}">
                <div style="font-weight: bold; color: var(--accent);">${f.characterName || 'Sem nome'}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                    Nível ${f.level || 1} • Criado: ${f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
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
        
        modal.querySelectorAll('.character-item').forEach(item => {
            item.addEventListener('click', () => {
                const characterId = item.getAttribute('data-id');
                document.body.removeChild(modal);
                loadFromFirebase(characterId);
            });
        });
        
        const closeBtn = document.getElementById('close-list');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
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
                showNotification('Login realizado!', 'success');
                resolve(true);
            } else {
                const errorEl = document.getElementById('auth-error');
                if (errorEl) {
                    errorEl.textContent = result.error;
                    errorEl.style.display = 'block';
                }
            }
        }
        
        const loginBtn = document.getElementById('auth-login');
        const registerBtn = document.getElementById('auth-register');
        const cancelBtn = document.getElementById('auth-cancel');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                const email = document.getElementById('auth-email').value;
                const password = document.getElementById('auth-password').value;
                const result = await FirebaseService.login(email, password);
                handleAuthResult(result);
            });
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', async () => {
                const email = document.getElementById('auth-email').value;
                const password = document.getElementById('auth-password').value;
                const result = await FirebaseService.register(email, password);
                handleAuthResult(result);
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
        }
    });
}

async function logout() {
    const result = await FirebaseService.logout();
    if (result.success) {
        currentCharacterId = null;
        showNotification('Logout realizado', 'success');
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// ========== UTILITIES ==========

function showNotification(message, type = 'info') {
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

function initPeculiarities() {
    const container = document.getElementById('peculiarities-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    PECULIARITIES.forEach(pec => {
        const div = document.createElement('div');
        div.className = 'peculiarity-item';
        div.innerHTML = `
            <div class="peculiarity-name">${pec.name}</div>
            <select class="peculiarity-select" data-pec="${pec.id}" style="width: 180px; background: var(--secondary)">
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
    if (listenersConfigured) return;
    
    console.log("Configurando event listeners...");
    
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
    const affinitySelect = document.getElementById('lin-affinity');
    if (affinitySelect) {
        affinitySelect.addEventListener('change', function() {
            ficha.linAffinity = this.value;
            if (ficha.linAffinity) applyAffinity();
        });
    }
    
    // Estado do Fio
    const threadStateSelect = document.getElementById('thread-state');
    if (threadStateSelect) {
        threadStateSelect.addEventListener('change', function() {
            const tenseContainer = document.getElementById('tense-state-container');
            if (tenseContainer) {
                tenseContainer.style.display = this.value === 'tense' ? 'block' : 'none';
            }
        });
    }
    
    // Vida atual
    const currentHealthInput = document.getElementById('current-health');
    if (currentHealthInput) {
        currentHealthInput.addEventListener('input', function() {
            ficha.health.current = parseInt(this.value) || 0;
            updateCalculations();
        });
    }
    
    // Essência atual
    const currentEssenceInput = document.getElementById('current-essence');
    if (currentEssenceInput) {
        currentEssenceInput.addEventListener('input', function() {
            ficha.essence.current = parseInt(this.value) || 0;
            updateCalculations();
        });
    }
    
    // Sliders de reputação
    document.querySelectorAll('.reputation-slider').forEach(slider => {
        slider.addEventListener('input', function() {
            const repId = this.id.replace('rep-', '');
            ficha.reputation[repId] = parseInt(this.value) || 0;
            const valueDisplay = document.getElementById(`${this.id}-value`);
            if (valueDisplay) valueDisplay.textContent = this.value;
            updateGeneralReputation();
        });
    });
    
    // Inputs de bônus
    const bonusInputs = ['armor', 'defense-bonus', 'resistance-bonus', 'essence-bonus', 'level'];
    bonusInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', updateCalculations);
    });
    
    listenersConfigured = true;
}

function initAfterLoad() {
    initPeculiarities();
    setupEventListeners();
    updateCalculations();
    updateInventorySlots();
    
    if (ficha.linAffinity) {
        const affinitySelect = document.getElementById('lin-affinity');
        if (affinitySelect) affinitySelect.value = ficha.linAffinity;
        applyAffinity();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // const isNewCharacter = localStorage.getItem('isNewCharacter') === 'true';
    // const characterIdToLoad = localStorage.getItem('currentCharacterId');
    
    // localStorage.removeItem('isNewCharacter');
    
    if (characterIdToLoad && !isNewCharacter) {
        currentCharacterId = characterIdToLoad;
        
        FirebaseService.onAuthStateChanged(async (user) => {
            if (user) {
                const result = await FirebaseService.loadFicha(characterIdToLoad);
                if (result.success) {
                    renderFicha(result.data);
                    showNotification(`Personagem "${result.data.characterName}" carregado!`, 'success');
                    initAfterLoad();
                }
            }
        });
    } else {
        resetFicha();
        renderFicha(ficha);
        showNotification("Nova ficha criada. Preencha os dados!", 'info');
        initAfterLoad();
    }
    
    FirebaseService.onAuthStateChanged((user) => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = user ? 'block' : 'none';
        
        if (user) console.log('Usuário autenticado:', user.email);
    });
    
    updateCalculations();
    updateInventorySlots();
});

// ========== ADICIONAR CSS PARA ANIMAÇÕES ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.8; }
        100% { opacity: 1; }
    }
    
    @keyframes glow {
        0% { box-shadow: 0 0 5px var(--accent); }
        50% { box-shadow: 0 0 20px var(--accent); }
        100% { box-shadow: 0 0 5px var(--accent); }
    }
    
    .over-max {
        animation: glow 2s infinite;
        border-color: var(--accent) !important;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10001;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);

// ========== EXPORTAR FUNÇÕES PARA USO GLOBAL ==========
window.ficha = ficha;
window.FirebaseService = FirebaseService;
window.saveToFirebase = saveToFirebase;
window.loadFromFirebase = loadFromFirebase;
window.showCharacterList = showCharacterList;
window.logout = logout;
window.addTemporaryHealth = addTemporaryHealth;
window.addTemporaryEssence = addTemporaryEssence;
window.clearTemporaryBonuses = clearTemporaryBonuses;
        // script.js

        // ========== CONFIGURAÇÕES ==========
        // Lista de peculiaridades
        const peculiarities = [
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
        const affinityMap = {
            1: { advantage: 1, disadvantage: 2, bonus: 5, penalty: -5 },
            2: { advantage: 2, disadvantage: 3, bonus: 5, penalty: -5 },
            3: { advantage: 3, disadvantage: 4, bonus: 5, penalty: -5 },
            4: { advantage: 4, disadvantage: 1, bonus: 5, penalty: -5 }
        };
        
        // ========== VARIÁVEIS GLOBAIS ==========
        let currentHealth = 9;
        let maxHealth = 9;
        let currentEssence = 3;
        let maxEssence = 3;
        let isDying = false;
        let isOverweight = false;
        let linAffinity = null;
        let inventorySlotsUsed = 0;
        let lastDamageTaken = 0;
        
        // ========== INICIALIZAÇÃO ==========
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar peculiaridades
            initPeculiarities();
            
            // Configurar event listeners
            setupEventListeners();
            
            // Calcular valores iniciais
            calculateAll();
            
            // Atualizar displays
            updateHealthDisplay();
            updateEssenceDisplay();

            document.querySelectorAll('.item-slots-input').forEach(input => {
        input.addEventListener('input', updateInventorySlots);

            updateInventorySlots();
    });
        });
        
        function initPeculiarities() {
            const container = document.getElementById('peculiarities-container');
            container.innerHTML = '';
            
            peculiarities.forEach(pec => {
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
                input.addEventListener('input', calculateAll);
            });
            
            // Modificadores de atributos principais
            document.querySelectorAll('.modifier-input').forEach(input => {
                input.addEventListener('input', calculateAll);
            });
            
            // Modificadores de sub-atributos linecinese
            document.querySelectorAll('.lin-mod-input').forEach(input => {
                input.addEventListener('input', function() {
                    updateLinGrades();
                });
            });
            
            // Linecinese principal
            document.getElementById('linecinese').addEventListener('input', function() {
                calculateAll();
                updateLinPoints();
            });
            
            // Sub-atributos Linecinese
            document.querySelectorAll('.lin-attr-input').forEach(input => {
                input.addEventListener('input', function() {
                    updateLinPoints();
                    updateLinGrades();
                });
            });
            
            // Afinidade - corrigido para limpar valores anteriores
            document.getElementById('lin-affinity').addEventListener('change', function() {
                // Limpar valores anteriores de afinidade
                resetAffinityValues();
                
                // Aplicar nova afinidade
                linAffinity = this.value;
                if (linAffinity) {
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
                const value = parseInt(this.value) || 0;
                currentHealth = value;
                updateHealthDisplay();
                checkDyingState();
            });
            
            // Essência atual
            document.getElementById('current-essence').addEventListener('input', function() {
                const value = parseInt(this.value) || 0;
                currentEssence = value;
                updateEssenceDisplay();
            });
            
            // Sliders de reputação
            document.querySelectorAll('.reputation-slider').forEach(slider => {
                slider.addEventListener('input', function() {
                    const value = this.value;
                    const displayId = this.id + '-value';
                    document.getElementById(displayId).textContent = value;
                    updateGeneralReputation();
                });
            });
            
            // Inputs de bônus
            const bonusInputs = ['armor', 'defense-bonus', 'resistance-bonus', 'essence-bonus', 'level'];
            bonusInputs.forEach(id => {
                document.getElementById(id).addEventListener('input', calculateAll);
            });
        }
        
        // ========== CÁLCULOS PRINCIPAIS ==========
        function calculateAll() {
            // Obter valores base dos atributos
            const level = parseInt(document.getElementById('level').value) || 1;
            const strengthBase = parseInt(document.getElementById('strength').value) || 1;
            const constitutionBase = parseInt(document.getElementById('constitution').value) || 1;
            const dexterityBase = parseInt(document.getElementById('dexterity').value) || 1;
            const intelligenceBase = parseInt(document.getElementById('intelligence').value) || 1;
            const spiritBase = parseInt(document.getElementById('spirit').value) || 1;
            const linecineseBase = parseInt(document.getElementById('linecinese').value) || 1;
            
            // Obter modificadores
            const strengthMod = parseInt(document.getElementById('strength-mod').value) || 0;
            const constitutionMod = parseInt(document.getElementById('constitution-mod').value) || 0;
            const dexterityMod = parseInt(document.getElementById('dexterity-mod').value) || 0;
            const intelligenceMod = parseInt(document.getElementById('intelligence-mod').value) || 0;
            const spiritMod = parseInt(document.getElementById('spirit-mod').value) || 0;
            const linecineseMod = parseInt(document.getElementById('linecinese-mod').value) || 0;
            
            // Calcular valores totais (atributo + modificador)
            const strength = strengthBase + strengthMod;
            const constitution = constitutionBase + constitutionMod;
            const dexterity = dexterityBase + dexterityMod;
            const intelligence = intelligenceBase + intelligenceMod;
            const spirit = spiritBase + spiritMod;
            const linecinese = linecineseBase + linecineseMod;
            
            // Calcular Vida Máxima
            maxHealth = (constitution * 3) + strength + (level * 5);
            
            // Ajustar vida atual se necessário
            if (currentHealth > maxHealth) {
                currentHealth = maxHealth;
                document.getElementById('current-health').value = currentHealth;
            }
            
            // Atualizar display de vida
            updateHealthDisplay();
            
            // Calcular Essência Máxima
            const essenceBonus = parseInt(document.getElementById('essence-bonus').value) || 0;
            maxEssence = (linecinese * 2) + spirit + essenceBonus;
            
            // Ajustar essência atual se necessário
            if (currentEssence > maxEssence) {
                currentEssence = maxEssence;
                document.getElementById('current-essence').value = currentEssence;
            }
            
            // Atualizar display de essência
            updateEssenceDisplay();
            
            // Calcular Defesa
            const armor = parseInt(document.getElementById('armor').value) || 0;
            const defenseBonus = parseInt(document.getElementById('defense-bonus').value) || 0;
            const defense = Math.floor(10 + (dexterity / 3)) + armor + defenseBonus;
            document.getElementById('defense-value').textContent = defense;
            
            // Calcular Resistência
            const resistanceBonus = parseInt(document.getElementById('resistance-bonus').value) || 0;
            const resistance = Math.floor(10 + (spirit / 2) + (linecinese / 5)) + resistanceBonus;
            document.getElementById('resistance-value').textContent = resistance;
            
            // Calcular Iniciativa
            const initiative = (dexterity + intelligence) / 4;
            document.getElementById('initiative-value').textContent = `d100 + ${initiative.toFixed(1)}`;
            
            // Calcular capacidade de carga
            const capacity = strength * 2;
            document.getElementById('capacity').textContent = capacity;
            document.getElementById('max-slots').textContent = capacity;
            
            // Atualizar slots disponíveis
            updateInventorySlots();
            
            // Verificar estado de morrendo
            checkDyingState();
            
            // Atualizar sub-atributos Linecinese
            updateLinPoints();
            updateLinGrades();
        }
        
        function updateHealthDisplay() {
            const healthPercent = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;
            
            // Atualizar valores
            document.getElementById('health-value').textContent = currentHealth;
            document.getElementById('health-text').textContent = `${currentHealth}/${maxHealth}`;
            document.getElementById('health-bar').style.width = `${healthPercent}%`;
            
            // Atualizar input
            document.getElementById('current-health').value = currentHealth;
            document.getElementById('current-health').max = maxHealth;
            
            // Cor da barra de saúde
            const healthBar = document.getElementById('health-bar');
            if (healthPercent > 50) {
                healthBar.style.background = 'linear-gradient(90deg, #2ed573, #27ae60)';
            } else if (healthPercent > 25) {
                healthBar.style.background = 'linear-gradient(90deg, #ffa502, #f39c12)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #ff4757, #e74c3c)';
            }
        }
        
        function updateEssenceDisplay() {
            const essencePercent = maxEssence > 0 ? (currentEssence / maxEssence) * 100 : 0;
            
            // Atualizar valores
            document.getElementById('essence-value').textContent = currentEssence;
            document.getElementById('essence-text').textContent = `${currentEssence}/${maxEssence}`;
            document.getElementById('essence-bar').style.width = `${essencePercent}%`;
            
            // Atualizar input
            document.getElementById('current-essence').value = currentEssence;
            document.getElementById('current-essence').max = maxEssence;
            
            // Cor da barra de essência
            const essenceBar = document.getElementById('essence-bar');
            essenceBar.style.background = 'linear-gradient(90deg, #00d4ff, #0097cc)';
        }
        
        function changeHealth(action) {
            const input = document.getElementById('health-change-input');
            const changeValue = parseInt(input.value) || 1;
            
            if (action === 'add') {
                currentHealth += changeValue;
                lastDamageTaken = 0; // Resetar dano recebido
            } else if (action === 'sub') {
                currentHealth -= changeValue;
                lastDamageTaken = changeValue;
                
                // Verificar se tomou mais da metade da vida máxima
                if (lastDamageTaken > maxHealth / 2) {
                    currentHealth = 0;
                    showDyingMessage();
                }
            }
            
            // Não permitir negativo
            if (currentHealth < 0) currentHealth = 0;
            
            updateHealthDisplay();
            checkDyingState();
        }
        
        function changeEssence(action) {
            const input = document.getElementById('essence-change-input');
            const changeValue = parseInt(input.value) || 1;
            
            if (action === 'add') {
                currentEssence += changeValue;
            } else if (action === 'sub') {
                currentEssence -= changeValue;
            }
            
            // Não permitir negativo
            if (currentEssence < 0) currentEssence = 0;
            
            updateEssenceDisplay();
        }
        
        function showDyingMessage() {
            alert("⚰️ VOCÊ TOMOU MAIS DA METADE DA SUA VIDA EM UM ÚNICO ATAQUE!\n\nESTADO: MORRENDO!");
        }
        
        function checkDyingState() {
            const healthCard = document.getElementById('health-card');
            isDying = currentHealth === 0;
            
            if (isDying) {
                healthCard.classList.add('dying');
            } else {
                healthCard.classList.remove('dying');
            }
        }
        
        // ========== SISTEMA DE LINECINESE ==========
        function resetAffinityValues() {
            // Resetar todos os sub-atributos para seus valores base
            for (let i = 1; i <= 4; i++) {
                const input = document.getElementById(`lin-attr-${i}`);
                const baseValue = parseInt(input.getAttribute('data-base-value') || '0');
                input.value = baseValue;
            }
        }
        
        function updateLinPoints() {
            const linecinese = parseInt(document.getElementById('linecinese').value) || 1;
            let totalUsed = 0;
            
            for (let i = 1; i <= 4; i++) {
                const input = document.getElementById(`lin-attr-${i}`);
                const value = parseInt(input.value) || 0;
                totalUsed += value;
                
                // Salvar valor base (sem modificadores de afinidade)
                if (!input.hasAttribute('data-base-value')) {
                    input.setAttribute('data-base-value', value);
                }
            }
            
            const available = linecinese - totalUsed;
            document.getElementById('lin-points-available').textContent = available;
            
            // Mostrar/ocultar seção
            const section = document.getElementById('lin-subattributes-section');
            section.style.display = linecinese > 0 ? 'block' : 'none';
        }
        
        function updateLinGrades() {
            for (let i = 1; i <= 4; i++) {
                const valueInput = document.getElementById(`lin-attr-${i}`);
                const modInput = document.getElementById(`lin-mod-${i}`);
                
                const value = parseInt(valueInput.value) || 0;
                const mod = parseInt(modInput.value) || 0;
                const total = value + mod;
                
                const grade = Math.min(Math.floor(total / 10) + 1, 5);
                const gradeRoman = ['I', 'II', 'III', 'IV', 'V'][grade - 1];
                document.getElementById(`lin-grade-${i}`).textContent = gradeRoman;
            }
        }
        
        function applyAffinity() {
            if (!linAffinity) return;
            
            const config = affinityMap[linAffinity];
            
            // Aplicar bônus e penalidade aos valores base
            const advantagedInput = document.getElementById(`lin-attr-${config.advantage}`);
            const disadvantagedInput = document.getElementById(`lin-attr-${config.disadvantage}`);
            
            // Obter valores base
            const advantagedBase = parseInt(advantagedInput.getAttribute('data-base-value') || '0');
            const disadvantagedBase = parseInt(disadvantagedInput.getAttribute('data-base-value') || '0');
            
            // Aplicar bônus/penalidade
            advantagedInput.value = advantagedBase + config.bonus;
            disadvantagedInput.value = disadvantagedBase + config.penalty;
            
            updateLinPoints();
            updateLinGrades();
        }
        
        // ========== SISTEMA DE REPUTAÇÃO ==========
        function updateGeneralReputation() {
            const sliders = document.querySelectorAll('.reputation-slider');
            let total = 0;
            
            sliders.forEach(slider => {
                total += parseInt(slider.value) || 0;
            });
            
            document.getElementById('general-reputation').textContent = total;
            
            // Cor da reputação geral
            const generalRep = document.getElementById('general-reputation');
            if (total > 0) {
                generalRep.style.color = 'var(--success)';
            } else if (total < 0) {
                generalRep.style.color = 'var(--danger)';
            } else {
                generalRep.style.color = 'var(--accent)';
            }
        }
        
        // ========== SISTEMA DE INVENTÁRIO ==========
        // Sistema de Slots (direto, não baseado em peso)
function calculateSlots(slotInput) {
    const slots = parseInt(slotInput) || 0;
    return Math.max(1, slots); // Mínimo 1 slot
}

function calculateSlots(slotInput) {
    const slots = parseInt(slotInput) || 0;
    return Math.max(1, slots); // Mínimo 1 slot
}

function updateInventorySlots() {
    console.log("Atualizando slots..."); // Debug
    
    // Selecionar APENAS os itens de inventário
    const items = document.querySelectorAll('#inventory-container .inventory-item');
    let slotsUsed = 0;
    
    console.log("Número de itens:", items.length); // Debug
    
    items.forEach((item, index) => {
        const slotInput = item.querySelector('.item-slots-input');
        if (slotInput) {
            const slots = parseInt(slotInput.value) || 1;
            console.log(`Item ${index + 1}: ${slots} slots`); // Debug
            slotsUsed += slots;
        }
    });
    
    console.log("Slots usados:", slotsUsed); // Debug
    
    const capacityEl = document.getElementById('capacity');
    const maxSlotsEl = document.getElementById('max-slots');
    const usedSlotsEl = document.getElementById('used-slots');
    const availableSlotsEl = document.getElementById('available-slots');
    
    const capacity = parseInt(capacityEl.textContent) || 0;
    const available = Math.max(0, capacity - slotsUsed);
    
    console.log("Capacidade:", capacity, "Usados:", slotsUsed, "Disponível:", available); // Debug
    
    if (maxSlotsEl) maxSlotsEl.textContent = capacity;
    if (usedSlotsEl) usedSlotsEl.textContent = slotsUsed;
    if (availableSlotsEl) availableSlotsEl.textContent = available;
    
    // Verificar sobrepeso
    isOverweight = slotsUsed > capacity;
    const warning = document.getElementById('overweight-warning');
    
    if (isOverweight) {
        if (warning) warning.style.display = 'block';
        console.log("SOBREPESO! Slots usados > capacidade"); // Debug
    } else {
        if (warning) warning.style.display = 'none';
    }
    
    inventorySlotsUsed = slotsUsed; // Atualizar variável global
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
    
    // Adicionar event listeners para o novo item
    const slotsInput = itemDiv.querySelector('.item-slots-input');
    if (slotsInput) {
        slotsInput.addEventListener('input', updateInventorySlots);
    }
    
    updateInventorySlots();
}
        
        // ========== SISTEMA DE HABILIDADES ==========
        function addAbility() {
            const container = document.getElementById('abilities-container');
            const abilityId = Date.now();
            
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
        
        // ========== SALVAR/CARREGAR DADOS ==========
        function saveData() {
            const data = {
                playerName: document.getElementById('player-name').value,
                characterName: document.getElementById('character-name').value,
                level: document.getElementById('level').value,
                money: document.getElementById('money').value,
                attributes: {
                    strength: document.getElementById('strength').value,
                    constitution: document.getElementById('constitution').value,
                    dexterity: document.getElementById('dexterity').value,
                    intelligence: document.getElementById('intelligence').value,
                    spirit: document.getElementById('spirit').value,
                    linecinese: document.getElementById('linecinese').value
                },
                modifiers: {
                    strength: document.getElementById('strength-mod').value,
                    constitution: document.getElementById('constitution-mod').value,
                    dexterity: document.getElementById('dexterity-mod').value,
                    intelligence: document.getElementById('intelligence-mod').value,
                    spirit: document.getElementById('spirit-mod').value,
                    linecinese: document.getElementById('linecinese-mod').value
                },
                linAttributes: {
                    1: document.getElementById('lin-attr-1').value,
                    2: document.getElementById('lin-attr-2').value,
                    3: document.getElementById('lin-attr-3').value,
                    4: document.getElementById('lin-attr-4').value
                },
                linModifiers: {
                    1: document.getElementById('lin-mod-1').value,
                    2: document.getElementById('lin-mod-2').value,
                    3: document.getElementById('lin-mod-3').value,
                    4: document.getElementById('lin-mod-4').value
                },
                linAffinity: document.getElementById('lin-affinity').value,
                currentHealth: currentHealth,
                currentEssence: currentEssence,
                threadState: document.getElementById('thread-state').value,
                tenseState: document.getElementById('tense-state').value,
                profession: document.getElementById('profession').value,
                web: document.getElementById('web').value,
                background: document.getElementById('background').value,
                armor: document.getElementById('armor').value,
                defenseBonus: document.getElementById('defense-bonus').value,
                resistanceBonus: document.getElementById('resistance-bonus').value,
                essenceBonus: document.getElementById('essence-bonus').value,
                reputation: {
                    weavers: document.getElementById('rep-weavers').value,
                    church: document.getElementById('rep-church').value,
                    periphery: document.getElementById('rep-periphery').value,
                    hunters: document.getElementById('rep-hunters').value,
                    survivors: document.getElementById('rep-survivors').value
                },
                history: document.getElementById('history').value,
                personality: document.getElementById('personality').value,
                notes: document.getElementById('notes').value
            };
            
            localStorage.setItem('tearCharacterData', JSON.stringify(data));
            alert("Dados salvos com sucesso!");
        }
        
        function loadData() {
            const saved = localStorage.getItem('tearCharacterData');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Carregar dados básicos
                document.getElementById('player-name').value = data.playerName || '';
                document.getElementById('character-name').value = data.characterName || '';
                document.getElementById('level').value = data.level || 1;
                document.getElementById('money').value = data.money || 0;
                
                // Carregar atributos
                if (data.attributes) {
                    document.getElementById('strength').value = data.attributes.strength || 1;
                    document.getElementById('constitution').value = data.attributes.constitution || 1;
                    document.getElementById('dexterity').value = data.attributes.dexterity || 1;
                    document.getElementById('intelligence').value = data.attributes.intelligence || 1;
                    document.getElementById('spirit').value = data.attributes.spirit || 1;
                    document.getElementById('linecinese').value = data.attributes.linecinese || 1;
                }
                
                // Carregar modificadores
                if (data.modifiers) {
                    document.getElementById('strength-mod').value = data.modifiers.strength || 0;
                    document.getElementById('constitution-mod').value = data.modifiers.constitution || 0;
                    document.getElementById('dexterity-mod').value = data.modifiers.dexterity || 0;
                    document.getElementById('intelligence-mod').value = data.modifiers.intelligence || 0;
                    document.getElementById('spirit-mod').value = data.modifiers.spirit || 0;
                    document.getElementById('linecinese-mod').value = data.modifiers.linecinese || 0;
                }
                
                // Carregar sub-atributos Linecinese
                if (data.linAttributes) {
                    document.getElementById('lin-attr-1').value = data.linAttributes[1] || 0;
                    document.getElementById('lin-attr-2').value = data.linAttributes[2] || 0;
                    document.getElementById('lin-attr-3').value = data.linAttributes[3] || 0;
                    document.getElementById('lin-attr-4').value = data.linAttributes[4] || 0;
                }
                
                // Carregar modificadores de sub-atributos
                if (data.linModifiers) {
                    document.getElementById('lin-mod-1').value = data.linModifiers[1] || 0;
                    document.getElementById('lin-mod-2').value = data.linModifiers[2] || 0;
                    document.getElementById('lin-mod-3').value = data.linModifiers[3] || 0;
                    document.getElementById('lin-mod-4').value = data.linModifiers[4] || 0;
                }
                
                // Carregar outros dados
                document.getElementById('lin-affinity').value = data.linAffinity || '';
                currentHealth = data.currentHealth || 9;
                currentEssence = data.currentEssence || 3;
                document.getElementById('thread-state').value = data.threadState || 'rest';
                document.getElementById('tense-state').value = data.tenseState || 'stable';
                document.getElementById('profession').value = data.profession || '';
                document.getElementById('web').value = data.web || '';
                document.getElementById('background').value = data.background || '';
                document.getElementById('armor').value = data.armor || 0;
                document.getElementById('defense-bonus').value = data.defenseBonus || 0;
                document.getElementById('resistance-bonus').value = data.resistanceBonus || 0;
                document.getElementById('essence-bonus').value = data.essenceBonus || 0;
                
                // Carregar reputação
                if (data.reputation) {
                    document.getElementById('rep-weavers').value = data.reputation.weavers || 0;
                    document.getElementById('rep-church').value = data.reputation.church || 0;
                    document.getElementById('rep-periphery').value = data.reputation.periphery || 0;
                    document.getElementById('rep-hunters').value = data.reputation.hunters || 0;
                    document.getElementById('rep-survivors').value = data.reputation.survivors || 0;
                    
                    // Atualizar displays
                    document.getElementById('rep-weavers-value').textContent = data.reputation.weavers || 0;
                    document.getElementById('rep-church-value').textContent = data.reputation.church || 0;
                    document.getElementById('rep-periphery-value').textContent = data.reputation.periphery || 0;
                    document.getElementById('rep-hunters-value').textContent = data.reputation.hunters || 0;
                    document.getElementById('rep-survivors-value').textContent = data.reputation.survivors || 0;
                }
                
                // Carregar textos
                document.getElementById('history').value = data.history || '';
                document.getElementById('personality').value = data.personality || '';
                document.getElementById('notes').value = data.notes || '';
                
                // Recalcular tudo
                calculateAll();
                updateGeneralReputation();
                updateHealthDisplay();
                updateEssenceDisplay();
                
                // Aplicar afinidade se houver
                if (data.linAffinity) {
                    setTimeout(() => {
                        document.getElementById('lin-affinity').value = data.linAffinity;
                        linAffinity = data.linAffinity;
                        applyAffinity();
                    }, 100);
                }
                
                alert("Dados carregados com sucesso!");
            } else {
                alert("Nenhum dado salvo encontrado!");
            }
        }
        
        // Inicializar peculiaridades ao carregar
        initPeculiarities();
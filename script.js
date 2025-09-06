const firebaseConfig = {
    apiKey: "AIzaSyA4n2Qzkt2iZ0NIRbcoSAtQbU39MCmWS0k",
    authDomain: "narucard-generation.firebaseapp.com",
    projectId: "narucard-generation",
    storageBucket: "narucard-generation.firebasestorage.app",
    messagingSenderId: "407670932960",
    appId: "1:407670932960:web:a2a54cc207b62447695785"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let cardData = {};
let currentTimer = null;
let timeRemaining = 20;

const gameState = {
    turn: 0,
    players: {
        '1naruto-uzumaki': { chakra: 0, choice: null, cooldowns: {}, paralysisTurns: 0, pendingParalysis: false },
        '1sasuke-uchiha': { chakra: 0, choice: null, cooldowns: {}, paralysisTurns: 0, pendingParalysis: false }
    }
};

const battleLog = document.getElementById('battle-log');
const timerDisplay = document.getElementById('timer');

// Define a vantagem elemental - Adicionado 'Genkai'
const elementalAdvantage = {
    'Fogo': 'Vento',
    'Vento': 'Raio',
    'Raio': 'Terra',
    'Terra': 'Agua',
    'Agua': 'Fogo',
    'Genkai': ['Fogo', 'Vento', 'Raio', 'Terra', 'Agua']
};

// Define o valor de cada Rank para comparação
const rankValue = {
    'E': 1,
    'D': 2,
    'C': 3,
    'B': 4,
    'A': 5,
    'S': 6,
    'SS': 7
};

function writeToLog(message) {
    battleLog.innerHTML += `<p>${message}</p>`;
    battleLog.scrollTop = battleLog.scrollHeight;
}

function updateUI() {
    renderCard(cardData['1naruto-uzumaki'], 'card-display-1');
    renderCard(cardData['1sasuke-uchiha'], 'card-display-2');
}

function calculateDamage() {
    const player1 = gameState.players['1naruto-uzumaki'];
    const player2 = gameState.players['1sasuke-uchiha'];

    const card1 = cardData['1naruto-uzumaki'];
    const card2 = cardData['1sasuke-uchiha'];

    let damage1 = 0;
    let damage2 = 0;
    
    // Calcula o dano do jogador 1
    if (player1.choice) {
        let basePower = player1.choice.power || 0;
        // Bônus por Rank
        if (rankValue[card1.rank] > rankValue[card2.rank]) {
            basePower += 5;
        }
        // Bônus por Elemento - Modificado para incluir a Genkai
        if (elementalAdvantage[card1.element] === card2.element || (card1.element === 'Genkai' && elementalAdvantage.Genkai.includes(card2.element))) {
            basePower += 5;
        }
        damage1 = Math.floor(basePower);
        
        // Se o jutsu 2 de naruto foi usado, nao causa dano e ativa a paralisia pendente
        if (card1.id === '1naruto-uzumaki' && player1.choice.name === card1.jutsus[1].name) {
             damage1 = 0;
             player2.pendingParalysis = true;
        }
    }

    // Calcula o dano do jogador 2
    if (player2.choice) {
        let basePower = player2.choice.power || 0;
        // Bônus por Rank
        if (rankValue[card2.rank] > rankValue[card1.rank]) {
            basePower += 5;
        }
        // Bônus por Elemento - Modificado para incluir a Genkai
        if (elementalAdvantage[card2.element] === card1.element || (card2.element === 'Genkai' && elementalAdvantage.Genkai.includes(card1.element))) {
            basePower += 5;
        }
        damage2 = Math.floor(basePower);
    }
    
    // Exibe as escolhas no log
    if (player1.choice) {
        writeToLog(`${card1.name} usou ${player1.choice.name}!`);
    } else if (player1.paralysisTurns > 0) {
        writeToLog(`${card1.name} está paralisado e não pode agir!`);
    }
    
    if (player2.choice) {
        writeToLog(`${card2.name} usou ${player2.choice.name}!`);
    } else if (player2.paralysisTurns > 0) {
        writeToLog(`${card2.name} está paralisado e não pode agir!`);
    }
    
    // Exibe a vantagem de Rank
    if (rankValue[card1.rank] > rankValue[card2.rank]) {
        writeToLog(`${card1.name} tem vantagem de Rank sobre ${card2.name}!`);
    } else if (rankValue[card2.rank] > rankValue[card1.rank]) {
        writeToLog(`${card2.name} tem vantagem de Rank sobre ${card1.name}!`);
    }

    // Exibe a vantagem Elemental
    if (elementalAdvantage[card1.element] === card2.element || (card1.element === 'Genkai' && elementalAdvantage.Genkai.includes(card2.element))) {
        writeToLog(`${card1.name} tem vantagem elemental sobre ${card2.name}!`);
    } else if (elementalAdvantage[card2.element] === card1.element || (card2.element === 'Genkai' && elementalAdvantage.Genkai.includes(card1.element))) {
        writeToLog(`${card2.name} tem vantagem elemental sobre ${card1.name}!`);
    }

    // Aplica o dano
    if (damage1 > damage2) {
        player2.chakra = Math.max(0, player2.chakra - damage1);
        writeToLog(`${card1.name} causou ${damage1} de dano.`);
        writeToLog(`${card2.name} tem ${player2.chakra} de Chakra restante.`);
    } else if (damage2 > damage1) {
        player1.chakra = Math.max(0, player1.chakra - damage2);
        writeToLog(`${card2.name} causou ${damage2} de dano.`);
        writeToLog(`${card1.name} tem ${player1.chakra} de Chakra restante.`);
    } else {
        writeToLog('Os jutsus se anularam! Nenhum dano foi causado.');
    }

    // Limpa as escolhas para a próxima rodada
    player1.choice = null;
    player2.choice = null;
}

function checkWinCondition() {
    if (gameState.players['1naruto-uzumaki'].chakra <= 0) {
        writeToLog(`${cardData['1sasuke-uchiha'].name} venceu a batalha!`);
        return true;
    }
    if (gameState.players['1sasuke-uchiha'].chakra <= 0) {
        writeToLog(`${cardData['1naruto-uzumaki'].name} venceu a batalha!`);
        return true;
    }
    return false;
}

function endRound() {
    clearInterval(currentTimer);
    gameState.turn++;
    writeToLog(`--- Fim do Turno ${gameState.turn} ---`);

    calculateDamage();
    updateUI();

    if (!checkWinCondition()) {
        startRound();
    } else {
        writeToLog('O jogo terminou. Para reiniciar, atualize a página.');
    }
}

function startRound() {
    for (const cardId in gameState.players) {
        const player = gameState.players[cardId];
        const opponentId = cardId === '1naruto-uzumaki' ? '1sasuke-uchiha' : '1naruto-uzumaki';
        const opponent = gameState.players[opponentId];
        
        // Aplica a paralisia pendente
        if (player.pendingParalysis) {
            player.paralysisTurns = 1;
            player.pendingParalysis = false;
        }

        for (const jutsuIndex in player.cooldowns) {
            if (player.cooldowns[jutsuIndex] > 0) {
                player.cooldowns[jutsuIndex]--;
            }
            if (player.cooldowns[jutsuIndex] === 0) {
                delete player.cooldowns[jutsuIndex];
            }
        }
        // Decrementa o timer de paralisia
        if (player.paralysisTurns > 0) {
            player.paralysisTurns--;
        }
        // Se o jogador está paralisado, a escolha dele é nula
        if (player.paralysisTurns > 0) {
            player.choice = null;
        }
    }

    timeRemaining = 20;
    timerDisplay.textContent = `${timeRemaining}s`;
    writeToLog(`--- Início do Turno ${gameState.turn + 1} ---`);
    writeToLog('Você tem 20 segundos para escolher um jutsu!');

    updateUI();

    currentTimer = setInterval(() => {
        timeRemaining--;
        timerDisplay.textContent = `${timeRemaining}s`;

        // Se ambos os jogadores não estiverem paralisados e escolheram, ou se um deles está paralisado, a rodada pode terminar.
        const player1 = gameState.players['1naruto-uzumaki'];
        const player2 = gameState.players['1sasuke-uchiha'];

        const bothNotParalyzed = player1.paralysisTurns === 0 && player2.paralysisTurns === 0;
        const player1Paralyzed = player1.paralysisTurns > 0;
        const player2Paralyzed = player2.paralysisTurns > 0;

        if (timeRemaining <= 0 || (player1.choice && player2.choice) || (player1Paralyzed && player2.choice) || (player2Paralyzed && player1.choice)) {
            endRound();
        }
        
    }, 1000);
}

window.handleJutsuClick = (cardId, jutsuIndex) => {
    const player = gameState.players[cardId];
    const opponentId = cardId === '1naruto-uzumaki' ? '1sasuke-uchiha' : '1naruto-uzumaki';
    const opponent = gameState.players[opponentId];
    
    // O botão já está desabilitado, então não precisa de verificação extra aqui
    if (player.choice || player.cooldowns[jutsuIndex] > 0) {
        return;
    }

    const jutsu = cardData[cardId].jutsus[jutsuIndex];
    player.choice = jutsu;
    
    if (jutsu.cooldown) {
        player.cooldowns[jutsuIndex] = jutsu.cooldown;
    }

    writeToLog(`${cardData[cardId].name} fez a sua escolha.`);
    
    if (gameState.players['1naruto-uzumaki'].choice && gameState.players['1sasuke-uchiha'].choice) {
        endRound();
    }
};

function renderCard(card, elementId) {
    const cardDisplay = document.getElementById(elementId);
    const playerState = gameState.players[card.id];

    let totalCooldownForCard = 0;
    const isParalyzed = playerState.paralysisTurns > 0;
    
    let paralysisText = '';
    if (isParalyzed) {
        paralysisText = `<span style="color: yellow; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">PARALISADO (${playerState.paralysisTurns})</span>`;
    }

    const jutsusHTML = card.jutsus ?
        `<div class="card-jutsus">` +
        card.jutsus.map((jutsu, index) => {
            const jutsuTitle = `Jutsu ${index + 1}: ${jutsu.name}`;
            const jutsuDescription = jutsu.description;

            const cooldown = playerState.cooldowns[index] || 0;
            const isDisabled = cooldown > 0 || !!playerState.choice || isParalyzed;
            const onclick = `handleJutsuClick('${card.id}', ${index})`;

            if (cooldown > 0) {
                totalCooldownForCard = Math.max(totalCooldownForCard, cooldown);
            }

            const buttonText = `<strong>${jutsuTitle}</strong><br>${jutsuDescription}`;

            return `<button class="jutsu-button" data-jutsu-index="${index}" onclick="${onclick}" ${isDisabled ? 'disabled' : ''}>${buttonText}</button>`;
        }).join('') + `</div>` :
        '<div>Nenhum jutsu encontrado.</div>';

    let cooldownDisplayText = '';
    if (totalCooldownForCard > 0) {
        cooldownDisplayText = `Jutsu em Recarga: ${totalCooldownForCard} turnos`;
    }

    cardDisplay.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-rank"><strong>Rank: ${card.rank}</strong></div>
        <img src="${card.image_url}" class="card-image" alt="Imagem da carta">
        ${jutsusHTML}
        <div class="card-stats">
            <span>PODER: ${card.power}</span>
            <span class="hp-display">CHAKRA: ${playerState.chakra}</span>
        </div>
        <div class="cooldown-text-display">${cooldownDisplayText}</div>
        ${paralysisText}
    `;

    // Alterado para aplicar a classe 'genkai'
    const elementClass = card.element === 'Genkai' ? 'genkai' : card.element.toLowerCase();
    cardDisplay.className = `card-display ${elementClass}`;
}

function loadCards() {
    const cardId1 = '1naruto-uzumaki'; 
    const cardId2 = '1sasuke-uchiha';

    const promises = [
        db.collection('cards').doc(cardId1).get(),
        db.collection('cards').doc(cardId2).get()
    ];

    Promise.all(promises).then(docs => {
        const card1Data = docs[0].data();
        card1Data.id = cardId1;
        cardData[cardId1] = card1Data;
        gameState.players[cardId1].chakra = card1Data.chakra;

        const card2Data = docs[1].data();
        card2Data.id = cardId2;
        cardData[card2Id] = card2Data;
        gameState.players[card2Id].chakra = card2Data.chakra;

        updateUI();
        startRound();
    }).catch(error => {
        console.error("Erro ao carregar as cartas:", error);
    });
}

loadCards();
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
        '1naruto-uzumaki': { chakra: 0, choice: null, cooldowns: {} },
        '1sasuke-uchiha': { chakra: 0, choice: null, cooldowns: {} }
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
        let basePower = card1.power;
        // Bônus por Rank
        if (rankValue[card1.rank] > rankValue[card2.rank]) {
            basePower += 5;
            writeToLog(`${card1.name} tem vantagem de Rank sobre ${card2.name}!`);
        }
        // Bônus por Elemento - Modificado para incluir a Genkai
        if (elementalAdvantage[card1.element] === card2.element || (card1.element === 'Genkai' && elementalAdvantage.Genkai.includes(card2.element))) {
            basePower *= 1.25; // 25% de bônus
            writeToLog(`${card1.name} tem vantagem elemental sobre ${card2.name}!`);
        }
        damage1 = Math.floor(basePower); // Garante que o dano é um número inteiro
        writeToLog(`${card1.name} usou ${player1.choice.name} e causou ${damage1} de dano.`);
    }

    // Calcula o dano do jogador 2
    if (player2.choice) {
        let basePower = card2.power;
        // Bônus por Rank
        if (rankValue[card2.rank] > rankValue[card1.rank]) {
            basePower += 5;
            writeToLog(`${card2.name} tem vantagem de Rank sobre ${card1.name}!`);
        }
        // Bônus por Elemento - Modificado para incluir a Genkai
        if (elementalAdvantage[card2.element] === card1.element || (card2.element === 'Genkai' && elementalAdvantage.Genkai.includes(card1.element))) {
            basePower *= 1.25; // 25% de bônus
            writeToLog(`${card2.name} tem vantagem elemental sobre ${card1.name}!`);
        }
        damage2 = Math.floor(basePower); // Garante que o dano é um número inteiro
        writeToLog(`${card2.name} usou ${player2.choice.name} e causou ${damage2} de dano.`);
    }

    // Aplica o dano
    if (damage1 > damage2) {
        // Altera o chakra, garantindo que não fique negativo
        player2.chakra = Math.max(0, player2.chakra - damage1);
        writeToLog(`${card2.name} tem ${player2.chakra} de Chakra restante.`);
    } else if (damage2 > damage1) {
        // Altera o chakra, garantindo que não fique negativo
        player1.chakra = Math.max(0, player1.chakra - damage2);
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
        for (const jutsuIndex in player.cooldowns) {
            if (player.cooldowns[jutsuIndex] > 0) {
                player.cooldowns[jutsuIndex]--;
            }
            if (player.cooldowns[jutsuIndex] === 0) {
                delete player.cooldowns[jutsuIndex];
            }
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

        if (timeRemaining <= 0) {
            endRound();
        }
    }, 1000);
}

window.handleJutsuClick = (cardId, jutsuIndex) => {
    if (gameState.players[cardId].choice) {
        return;
    }
    if (gameState.players[cardId].cooldowns[jutsuIndex] > 0) {
        return;
    }

    const jutsu = cardData[cardId].jutsus[jutsuIndex];
    gameState.players[cardId].choice = jutsu;

    if (jutsu.cooldown) {
        gameState.players[cardId].cooldowns[jutsuIndex] = jutsu.cooldown;
    } else {
        gameState.players[cardId].cooldowns[jutsuIndex] = 0;
    }

    writeToLog(`${cardData[cardId].name} escolheu ${jutsu.name}!`);

    if (gameState.players['1naruto-uzumaki'].choice && gameState.players['1sasuke-uchiha'].choice) {
        endRound();
    }
};

function renderCard(card, elementId) {
    const cardDisplay = document.getElementById(elementId);
    const playerState = gameState.players[card.id];

    let totalCooldownForCard = 0;
    const jutsusHTML = card.jutsus ?
        `<div class="card-jutsus">` +
        card.jutsus.map((jutsu, index) => {
            const jutsuTitle = `Jutsu ${index + 1}: ${jutsu.name}`;
            const jutsuDescription = jutsu.description;

            const cooldown = playerState.cooldowns[index] || 0;
            const isDisabled = cooldown > 0 || !!playerState.choice;
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
        cardData[cardId2] = card2Data;
        gameState.players[cardId2].chakra = card2Data.chakra;

        updateUI();
        startRound();
    }).catch(error => {
        console.error("Erro ao carregar as cartas:", error);
    });
}

loadCards();
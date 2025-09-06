const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const cardsData = require('./cards.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncCards() {
  console.log('Iniciando a sincronização dos dados das cartas...');
  const batch = db.batch();

  try {
    for (const cardId in cardsData) {
      if (cardsData.hasOwnProperty(cardId)) {
        const cardRef = db.collection('cards').doc(cardId);
        batch.set(cardRef, cardsData[cardId]);
      }
    }

    await batch.commit();
    console.log('Sincronização concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao sincronizar as cartas:', error);
    process.exit(1);
  }
}

syncCards();
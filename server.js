

const express = require('express');

const app = express();
app.use(express.json());

// =======================
// Configuration
// =======================

const PORT = process.env.PORT || 10000;
const BASE_URL = 'https://bitcoin-raffle-backend.onrender.com';

const OPENNODE_API_KEY = process.env.OPENNODE_API_KEY;

// =======================
// Database (Temporary)
// Replace with MongoDB/Postgres later
// =======================

const db = {
  tier25: {
    currentTickets: [],
    megaPool: [],
    cycleCount: 0
  },

  tier100: {
    currentTickets: [],
    megaPool: [],
    cycleCount: 0
  }
};

// =======================
// Raffle Rules
// =======================

const RAFFLE_CONFIG = {
  25: {
    ticketPrice: 25,
    maxTickets: 3,
    maxCycles: 10,
    standardPrize: 50,
    megaPrize: 100
  },

  100: {
    ticketPrice: 100,
    maxTickets: 3,
    maxCycles: 10,
    standardPrize: 200,
    megaPrize: 400
  }
};

// =======================
// Home Route
// =======================

app.get('/', (req, res) => {
  res.send('🎟️ Bitcoin Raffle Backend Running');
});

// =======================
// Test Draw
// =======================

app.get('/api/test-draw', (req, res) => {

  const players = [
    'player_alpha@test.com',
    'player_beta@test.com',
    'player_gamma@test.com'
  ];

  const winner =
    players[Math.floor(Math.random() * players.length)];

  res.send(`
    <h1>🎰 Test Draw Complete</h1>

    <p><strong>Tickets Sold:</strong> 3 / 3</p>

    <p><strong>Tier:</strong> $25</p>

    <p><strong>Winner:</strong> ${winner}</p>

    <p><strong>Prize:</strong> $50 BTC</p>
  `);

});

// =======================
// Process Ticket Purchase
// =======================

function processTicketPurchase(tier, userEmail) {

  const config = RAFFLE_CONFIG[tier];

  if (!config) return;

  const state =
    tier === 25
      ? db.tier25
      : db.tier100;

  if (state.currentTickets.includes(userEmail)) {
    return;
  }

  state.currentTickets.push(userEmail);
  state.megaPool.push(userEmail);

  if (state.currentTickets.length >= config.maxTickets) {

    executeDrawing(
      tier,
      'STANDARD',
      state.currentTickets,
      config.standardPrize
    );

    state.currentTickets = [];

    state.cycleCount++;

    if (state.cycleCount >= config.maxCycles) {

      executeDrawing(
        tier,
        'MEGA',
        state.megaPool,
        config.megaPrize
      );

      state.megaPool = [];
      state.cycleCount = 0;

    }

  }

}

// =======================
// Draw Winner
// =======================

function executeDrawing(
  tier,
  drawType,
  entrants,
  prize
) {

  if (!entrants.length) return;

  const winner =
    entrants[
      Math.floor(Math.random() * entrants.length)
    ];

  console.log('==========================');
  console.log(`${drawType} DRAW`);
  console.log(`Tier: $${tier}`);
  console.log(`Winner: ${winner}`);
  console.log(`Prize: $${prize}`);
  console.log('==========================');

}

// =======================
// Server
// =======================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

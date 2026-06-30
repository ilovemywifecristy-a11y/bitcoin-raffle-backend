const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🎟️ Bitcoin Raffle Backend is Wide Awake and Running!');
});

// Fixed Test Route to output the winner right to your web browser window
app.get('/api/test-draw', (req, res) => {
  const pool = ['player_alpha@test.com', 'player_beta@test.com', 'player_gamma@test.com'];
  const randomIndex = Math.floor(Math.random() * pool.length);
  const winner = pool[randomIndex];
  
  res.send(`
    <h1>🎰 Raffle Engine Test Successful!</h1>
    <p><strong>Tickets Sold:</strong> 3 / 3</p>
    <p><strong>Raffle Track:</strong> Tier $25</p>
    <p><strong>🏆 WINNER DETERMINED:</strong> ${winner}</p>
    <p><strong>Prize Allocated:</strong> $50 USD in Bitcoin</p>
  `);
});

// OpenNode Testnet Configuration
const OPENNODE_API_KEY = '8571a2aa-044d-49ba-a798-bf0c0db7badb';
const OPENNODE_API_URL = 'https://dev-api.opennode.com'; // Fixed to developer testnet endpoint

// Local Live State
const db = {
  tier25: { currentTickets: [], megaPool: [], cycleCount: 0 },
  tier100: { currentTickets: [], megaPool: [], cycleCount: 0 }
};

// Exact Raffle Metrics and Rules
const RAFFLE_CONFIG = {
  25:  { ticketPrice: 25,  maxTickets: 3, maxCycles: 10, standardPrize: 50,  megaPrize: 100 },
  100: { ticketPrice: 100, maxTickets: 3, maxCycles: 10, standardPrize: 200, megaPrize: 400 }
};

/**
 * 1. Endpoint: Generate OpenNode Testnet Lightning Invoice
 */
app.post('/api/checkout', async (req, res) => {
  const { tier, userEmail } = req.body; 
  
  if (!RAFFLE_CONFIG[tier]) {
    return res.status(400).json({ error: 'Invalid raffle tier chosen.' });
  }

  try {
    const config = RAFFLE_CONFIG[tier];
    const response = await axios.post(`${OPENNODE_API_URL}/v1/charges`, {
      amount: config.ticketPrice,
      currency: 'USD',
      description: `Raffle Tier $${config.ticketPrice} - Entry Ticket`,
      callback_url: `https://onrender.com`,
      metadata: {
        tier: tier.toString(),
        userEmail: userEmail
      }
    }, {
      headers: { 'Authorization': OPENNODE_API_KEY, 'Content-Type': 'application/json' }
    });

    res.json({
      invoice: response.data.data.lightning_invoice.payreq,
      chargeId: response.data.data.id
    });
  } catch (error) {
    console.error('Invoice generation failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create payment invoice.' });
  }
});

/**
 * 2. Endpoint: OpenNode Webhook (Processes automatically upon payment)
 */
app.post('/api/webhook', async (req, res) => {
  const { id, status, metadata } = req.body;

  if (status !== 'paid') {
    return res.status(200).send('Charge not paid yet.');
  }

  const tier = parseInt(metadata.tier);
  const userEmail = metadata.userEmail;
  
  processTicketPurchase(tier, userEmail);
  res.status(200).send('Webhook processed.');
});

/**
 * Core Raffle Logic Engine
 */
function processTicketPurchase(tier, userEmail) {
  const config = RAFFLE_CONFIG[tier];
  const state = tier === 25 ? db.tier25 : db.tier100;

  state.currentTickets.push(userEmail);
  state.megaPool.push(userEmail);

  if (state.currentTickets.length === config.maxTickets) {
    executeDrawing(tier, 'Standard', state.currentTickets, config.standardPrize);
    state.currentTickets = []; 
    state.cycleCount++;        
    
    if (state.cycleCount === config.maxCycles) {
      executeDrawing(tier, 'MEGA', state.megaPool, config.megaPrize);
      state.megaPool = [];     
      state.cycleCount = 0;    
    }
  }
}

/**
 * Random Winner Selection Algorithm
 */
function executeDrawing(tier, drawType, entrantsPool, prizeAmountUSD) {
  const randomIndex = Math.floor(Math.random() * entrantsPool.length);
  const winner = entrantsPool[randomIndex];
  console.log(`🏆 ${drawType} WINNER FOR TIER $${tier}: ${winner} wins $${prizeAmountUSD} USD in BTC!`);
}

// Start Server - Cleaned up single declaration
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Raffle Backend running on port ${PORT}`);
});

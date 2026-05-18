require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos.' }
});
app.use('/api/', limiter);

// --- Helpers ---

function generateJWT() {
  const payload = {
    application_id: process.env.VONAGE_API_KEY,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    jti: uuidv4()
  };
  return jwt.sign(payload, process.env.VONAGE_API_SECRET, { algorithm: 'HS256' });
}

async function makeVonageCall(toNumber, answerUrl) {
  const token = generateJWT();
  const response = await axios.post(
    'https://api.nexmo.com/v1/calls',
    {
      to: [{ type: 'phone', number: toNumber }],
      from: { type: 'phone', number: process.env.VONAGE_NUMBER },
      answer_url: [answerUrl]
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// --- Endpoints ---

// Genera JWT
app.post('/api/vonage/generate-jwt', (req, res) => {
  try {
    const token = generateJWT();
    res.json({ jwt: token });
  } catch (err) {
    res.status(500).json({ error: 'Error generando JWT', detail: err.message });
  }
});

// NCCO: mensaje de emergencia
app.get('/api/vonage/ncco', (req, res) => {
  res.json([
    {
      action: 'talk',
      text: 'Emergencia Gatwick. Revisa el WhatsApp.',
      language: 'es-MX',
      loop: 3
    }
  ]);
});

// Llamada de prueba
app.get('/api/vonage/test-call', async (req, res) => {
  const { to } = req.query;
  if (!to) {
    return res.status(400).json({ error: 'Parámetro "to" requerido. Ejemplo: ?to=51972619000' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const nccoUrl = `${baseUrl}/api/vonage/ncco`;

  try {
    const result = await makeVonageCall(to, nccoUrl);
    res.json({ success: true, call: result });
  } catch (err) {
    const detail = err.response?.data || err.message;
    res.status(500).json({ error: 'Error al realizar la llamada', detail });
  }
});

// Llamada desde n8n (POST con body)
app.post('/api/vonage/call', async (req, res) => {
  const { to, ncco_url } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Campo "to" requerido en el body.' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const answerUrl = ncco_url || `${baseUrl}/api/vonage/ncco`;

  try {
    const result = await makeVonageCall(to, answerUrl);
    res.json({ success: true, call: result });
  } catch (err) {
    const detail = err.response?.data || err.message;
    res.status(500).json({ error: 'Error al realizar la llamada', detail });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Gatwick Vonage JWT Server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;

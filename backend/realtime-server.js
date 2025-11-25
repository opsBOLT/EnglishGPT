import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;
// Use X_API_KEY (OpenRouter/OpenAI compatible key) as primary, fall back to OPENAI_API_KEY if set.
const OPENAI_API_KEY = process.env.X_API_KEY || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// Basic CORS for local dev (Vite runs on 5173 by default)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse raw SDP posted from the browser
app.use(express.text({ type: ['application/sdp', 'text/plain'] }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/realtime/session', async (req, res) => {
  if (!OPENAI_API_KEY) {
    console.error('[realtime] missing X_API_KEY/OPENAI_API_KEY on server');
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY on server' });
  }

const sessionConfig = JSON.stringify({
  type: 'realtime',
  model: 'gpt-realtime-mini',
  audio: {
    output: { voice: 'alloy' },
  },
});

  try {
    const fd = new FormData();
    fd.set('sdp', req.body);
    fd.set('session', sessionConfig);

    const response = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: fd,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[realtime] failed to create session', response.status, errText);
      return res.status(response.status).send(errText || 'Failed to create session');
    }

    const sdpAnswer = await response.text();
    console.log('[realtime] session created');
    res.type('application/sdp').send(sdpAnswer);
  } catch (error) {
    console.error('[realtime] token generation error', error);
    res.status(500).json({ error: 'Failed to generate session' });
  }
});

app.listen(PORT, () => {
  console.log(`[realtime] server listening on http://localhost:${PORT}`);
});

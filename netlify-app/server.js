const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const { handler } = require('./netlify/functions/api');

// Express 5 — use regex route, no wildcards
app.use('/api', async (req, res) => {
  const event = {
    httpMethod: req.method,
    path: '/api' + req.path,
    queryStringParameters: req.query || {},
    body: req.body ? JSON.stringify(req.body) : null,
    headers: req.headers,
  };
  const result = await handler(event);
  res.status(result.statusCode);
  Object.entries(result.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.send(result.body);
});

// SPA fallback — serve index.html for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 4000;
app.listen(PORT, () => console.log('Server up: http://localhost:' + PORT));

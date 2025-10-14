const express = require('express');
const app = express();
const port = 8000;

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CareHealth EHR Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'CareHealth EHR API',
    version: 'v1',
    status: 'Running'
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`API: http://localhost:${port}/api/v1`);
});

module.exports = app;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/config.json');
const database = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointment');
const RoleService = require('./app/Services/RoleService');

const app = express();
const port = process.env.PORT || config.server.port;

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CareHealth EHR Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get(`/api/${config.server.apiVersion}`, (req, res) => {
  res.json({
    message: 'CareHealth EHR API',
    version: config.server.apiVersion,
    status: 'Running',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      patients: '/api/v1/patients',
      appointments: '/api/v1/appointments'
    }
  });
});

app.use(`/api/${config.server.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.server.apiVersion}/users`, userRoutes);
app.use(`/api/${config.server.apiVersion}/roles`, roleRoutes);
app.use(`/api/${config.server.apiVersion}/patients`, patientRoutes);
app.use(`/api/${config.server.apiVersion}/appointments`, appointmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.use((error, req, res, next) => {
  console.error('Global Error Handler:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(config.server.nodeEnv === 'development' && { stack: error.stack })
  });
});

async function startServer() {
  try {
    await database.connect();
    await RoleService.initializeRoles();
    
    app.listen(port, () => {
      console.log('CareHealth EHR Server Started!');
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
      console.log(`API Version: ${config.server.apiVersion}`);
      console.log(`Health Check: http://localhost:${port}/health`);
      console.log(`API Base URL: http://localhost:${port}/api/${config.server.apiVersion}`);
      console.log(`Auth Endpoints:`);
      console.log(`POST http://localhost:${port}/api/${config.server.apiVersion}/auth/register`);
      console.log(`POST http://localhost:${port}/api/${config.server.apiVersion}/auth/login`);
    });
  } catch (error) {
    console.error('Database connection failed, but server is running:', error.message);
    console.log('You can still test the API endpoints');
    
    app.listen(port, () => {
      console.log('CareHealth EHR Server Started!');
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
      console.log(`API Version: ${config.server.apiVersion}`);
      console.log(`Health Check: http://localhost:${port}/health`);
      console.log(`API Base URL: http://localhost:${port}/api/${config.server.apiVersion}`);
      console.log(`Auth Endpoints:`);
      console.log(`POST http://localhost:${port}/api/${config.server.apiVersion}/auth/register`);
      console.log(`POST http://localhost:${port}/api/${config.server.apiVersion}/auth/login`);
    });
  }
}

startServer();

module.exports = app;
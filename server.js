require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/config.json');
const database = require('./config/database');

class CareHealthServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || config.server.port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(helmet());
    
    this.app.use(cors({
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
    this.app.use('/api/', limiter);

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (config.server.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.nodeEnv
      });
    });

    this.app.use(`/api/${config.server.apiVersion}`, (req, res) => {
      res.status(200).json({
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

    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    this.app.use((error, req, res, next) => {
      console.error('Global Error Handler:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';
      
      res.status(statusCode).json({
        error: message,
        ...(config.server.nodeEnv === 'development' && { stack: error.stack })
      });
    });
  }

  async start() {
    try {
      await database.connect();
      
      this.app.listen(this.port, () => {
        console.log('🚀 CareHealth EHR Server Started!');
        console.log(`📡 Server running on port ${this.port}`);
        console.log(`🌍 Environment: ${config.server.nodeEnv}`);
        console.log(`📋 API Version: ${config.server.apiVersion}`);
        console.log(`🔗 Health Check: http://localhost:${this.port}/health`);
        console.log(`📊 API Base URL: http://localhost:${this.port}/api/${config.server.apiVersion}`);
      });

      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    console.log('🔄 Shutting down server...');
    await database.disconnect();
    process.exit(0);
  }
}

const server = new CareHealthServer();
server.start();

module.exports = server;

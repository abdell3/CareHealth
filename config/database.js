const mongoose = require('mongoose');
const config = require('./config.json');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoUri = process.env.NODE_ENV === 'production' 
        ? config.database.mongodbUri 
        : config.database.mongodbLocalUri;

      console.log('🔄 Connecting to MongoDB...');
      
      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${this.connection.connection.db.databaseName}`);
      
      return this.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('MongoDB disconnected successfully');
      }
    } catch (error) {
      console.error('MongoDB disconnection error:', error.message);
    }
  }

  getConnection() {
    return this.connection;
  }

  getDatabase() {
    return this.connection?.connection?.db;
  }
}

module.exports = new Database();

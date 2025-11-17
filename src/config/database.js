const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const fallbackUri =
        process.env.NODE_ENV === 'production'
          ? 'mongodb://mongo:27017/careHealthdb'
          : 'mongodb://localhost:27017/careHealthdb';
      const mongoUri = process.env.MONGO_URI || fallbackUri;

      console.log('Connecting to MongoDB...');
      console.log('MongoDB URI:', mongoUri);
      
      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('MongoDB connected successfully');
      console.log(`Database: ${this.connection.connection.db.databaseName}`);
      
      return this.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      if (process.env.NODE_ENV !== 'development') {
        process.exit(1);
      }
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
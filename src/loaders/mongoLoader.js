const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");
const { getLogger } = require("../core/utils/logger");

const logger = getLogger();
let connection = null;
let listenersInitialized = false;

function initListeners() {
  if (listenersInitialized || !mongoose.connection) {
    return;
  }

  mongoose.connection.on("connected", () => {
    logger.info({ message: "MongoDB connected" });
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ message: "MongoDB connection error", error: err && err.message ? err.message : err });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn({ message: "MongoDB disconnected" });
  });

  listenersInitialized = true;
}

async function connect() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  if (connection) {
    return connection;
  }

  await mongoose.connect(MONGO_URI);
  connection = mongoose.connection;
  initListeners();
  return connection;
}

async function disconnect() {
  if (!connection) {
    return;
  }

  await mongoose.disconnect();
  connection = null;
}

module.exports = {
  connect,
  disconnect,
};



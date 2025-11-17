const AppError = require("./AppError").AppError;

class ServiceUnavailableError extends AppError {
  constructor(message = "Service Unavailable") {
    super(message, 503, true);
  }
}

module.exports = { ServiceUnavailableError };


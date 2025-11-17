const AppError = require("./AppError").AppError;

class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, true);
  }
}

module.exports = { ConflictError };


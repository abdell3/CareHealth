const AppError = require("./AppError").AppError;

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, true);
  }
}

module.exports = { ForbiddenError };


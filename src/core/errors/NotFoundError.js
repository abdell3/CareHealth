const AppError = require("./AppError").AppError;

class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404, true);
  }
}

module.exports = { NotFoundError };


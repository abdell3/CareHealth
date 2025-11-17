const AppError = require("./AppError").AppError;

class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400, true);
  }
}

module.exports = { BadRequestError };


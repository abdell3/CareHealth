import { AppError } from "./AppError";

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service Unavailable") {
    super(message, 503, true);
  }
}


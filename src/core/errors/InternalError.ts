import { AppError } from "./AppError";

export class InternalError extends AppError {
  constructor(message: string = "Internal Server Error") {
    super(message, 500, true);
  }
}



import { AppError } from "../errors/AppError";

export function errorHandler(err: unknown, req: any, res: any, next: any): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    statusCode: 500,
  });
}



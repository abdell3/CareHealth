import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/UnauthorizedError";

type DecodedToken = {
  userId?: string;
  id?: string;
  role?: unknown;
  [key: string]: unknown;
};

export function authMiddleware(req: any, res: any, next: any): void {
  const headerValue = req.headers["authorization"] || req.headers["Authorization"];

  if (!headerValue || typeof headerValue !== "string") {
    throw new UnauthorizedError("Authorization header missing");
  }

  const parts = headerValue.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    throw new UnauthorizedError("Authorization header malformed");
  }

  const token = parts[1];
  const accessSecret = process.env.JWT_ACCESS_SECRET;

  if (!accessSecret) {
    throw new UnauthorizedError("Invalid token");
  }

  try {
    const decoded = jwt.verify(token, accessSecret) as DecodedToken;
    const id = decoded.userId || decoded.id;

    if (!id) {
      throw new UnauthorizedError("Invalid token payload");
    }

    req.user = {
      id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}



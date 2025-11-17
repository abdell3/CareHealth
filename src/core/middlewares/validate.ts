import { BadRequestError } from "../errors/BadRequestError";

type Schema = {
  safeParse: (data: unknown) => { success: boolean; data?: unknown; error?: { message?: string } };
};

export function validate(schema: Schema) {
  return (req: any, res: any, next: any): void => {
    const payload = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    const result = schema.safeParse(payload);

    if (!result.success) {
      const message = result.error && result.error.message ? result.error.message : "Validation failed";
      throw new BadRequestError(message);
    }

    next();
  };
}



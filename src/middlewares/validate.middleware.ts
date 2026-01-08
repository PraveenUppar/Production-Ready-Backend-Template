import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

const validate =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if req.body/query/params matches the schema rules
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If successful, move to the Controller
      next();
    } catch (error) {
      // If validation fails, format the error nicely
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: error.issues.map((err: any) => ({
            field: err.path[1], // e.g., "email"
            message: err.message, // e.g., "Invalid email format"
          })),
        });
      }
      next(error);
    }
  };

export default validate;

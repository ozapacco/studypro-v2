import type { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export function validateRequest(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push(`${rule.field} must be a string`);
        }

        if (rule.type === 'number' && typeof value !== 'number') {
          errors.push(`${rule.field} must be a number`);
        }

        if (rule.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${rule.field} must be a boolean`);
        }

        if (rule.type === 'array' && !Array.isArray(value)) {
          errors.push(`${rule.field} must be an array`);
        }

        if (rule.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
          errors.push(`${rule.field} must be an object`);
        }

        if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
        }

        if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max}`);
        }

        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    next();
  };
}

export function validateQuery(rules: { field: string; type: string; required?: boolean }[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.query[rule.field];

      if (rule.required && !value) {
        errors.push(`${rule.field} query param is required`);
      }

      if (value && rule.type === 'number' && isNaN(Number(value))) {
        errors.push(`${rule.field} must be a number`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    next();
  };
}
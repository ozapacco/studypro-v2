import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
  console.error(`[Error] ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    error: message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Resource not found',
    path: req.path,
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
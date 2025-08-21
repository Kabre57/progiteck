import { Response } from 'express';
import { ApiResponse } from '@/types';
import { logger } from '@/config/logger';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Succès',
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };

  res.status(statusCode).json(response);
};

export const sendSuccessWithPagination = <T>(
  res: Response,
  data: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  },
  message: string = 'Succès'
): void => {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination
  };

  res.status(200).json(response);
};

export const successResponse = (res: Response, message: string, data?: any, statusCode: number = 200): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};


export const errorResponse = (res: Response, message: string, statusCode: number = 500): Response => {
  return res.status(statusCode).json({
    success: false,
    error: message
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): void => {
  const response: ApiResponse<unknown> = {
    success: false,
    message,
    ...(error && { error })
  };

  logger.error(`Error ${statusCode}: ${message}`, { error });
  res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: Array<{ field: string; message: string }>
): void => {
  const response = {
    success: false,
    message: 'Erreurs de validation',
    errors
  };

  res.status(400).json(response);
};


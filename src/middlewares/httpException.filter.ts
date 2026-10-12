import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  extractErrorMessage,
  extractErrorName,
  extractStatusCode,
} from '@utils/http.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = extractStatusCode(exception);

    response.status(statusCode).json({
      statusCode,
      error: extractErrorName(exception, statusCode),
      message: extractErrorMessage(exception),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

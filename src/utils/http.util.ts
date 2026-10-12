import { HttpException, HttpStatus } from '@nestjs/common';
import type { IHttpExceptionBody } from '@interfaces/httpException.interface';

function isHttpExceptionBody(body: unknown): body is IHttpExceptionBody {
  return typeof body === 'object' && body !== null;
}

/**
 * Resolves the HTTP status code an error should be answered with.
 *
 * @param exception - Anything that was thrown.
 * @returns The status of an `HttpException`, 500 for anything else.
 */
export function extractStatusCode(exception: unknown): number {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Reads the human-readable message out of a thrown error.
 *
 * Validation errors carry an array of messages; they are joined into one
 * string so every error body has the same shape.
 *
 * @param exception - Anything that was thrown.
 * @returns The exception's message, or a generic one when nothing usable was thrown.
 */
export function extractErrorMessage(exception: unknown): string {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    const message = isHttpExceptionBody(body) ? body.message : undefined;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;

    return exception.message;
  }

  return exception instanceof Error
    ? exception.message
    : 'Internal server error';
}

/**
 * Reads the short error name (`Not Found`, `Conflict`, …) out of a thrown error.
 *
 * @param exception - Anything that was thrown.
 * @param statusCode - The status the error is answered with, used as the fallback name.
 * @returns The exception's own error name, or the name of its status code.
 */
export function extractErrorName(
  exception: unknown,
  statusCode: number,
): string {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    const error = isHttpExceptionBody(body) ? body.error : undefined;
    if (typeof error === 'string') return error;
  }

  return HttpStatus[statusCode] ?? 'Internal Server Error';
}

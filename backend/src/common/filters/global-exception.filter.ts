import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ── HttpException (thrown by NestJS or our own code) ──────────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // If we already shaped the error ourselves (object with { error: {...} })
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'error' in exceptionResponse
      ) {
        return response.status(status).json(exceptionResponse);
      }

      // NestJS built-in validation pipe errors come as { message: string[], error, statusCode }
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const msg = (exceptionResponse as { message: string | string[] }).message;
        const detail = Array.isArray(msg) ? msg.join('; ') : String(msg);
        return response.status(status).json({
          error: { code: 'VALIDATION_ERROR', message: detail },
        });
      }

      // Fallback for plain string HttpExceptions
      return response.status(status).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: String(exceptionResponse),
        },
      });
    }

    // ── SyntaxError — malformed JSON body ─────────────────────────────────
    if (exception instanceof SyntaxError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON in request body.' },
      });
    }

    // ── Unexpected / unhandled errors → 500 ───────────────────────────────
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  }
}

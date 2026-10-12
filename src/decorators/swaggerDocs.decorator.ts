import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import type {
  ApiResponseCommonMetadata,
  ApiResponseOptions,
} from '@nestjs/swagger';
import type { ISwaggerEndpoint } from '@interfaces/swaggerDocs.interface';

type SwaggerResponseType = NonNullable<ApiResponseCommonMetadata['type']>;

const LOWEST_SUCCESS_STATUS = 200;
const HIGHEST_SUCCESS_STATUS = 299;

function documentsSuccess(statusCode: number): boolean {
  return (
    statusCode >= LOWEST_SUCCESS_STATUS && statusCode <= HIGHEST_SUCCESS_STATUS
  );
}

/**
 * Applies every Swagger decorator an endpoint needs, read off one schema.
 *
 * `@SwaggerDocs(ORDER_SWAGGER.CREATE, OrderResponseDto)` replaces the stack
 * of `@ApiOperation` / `@ApiParam` / `@ApiResponse` calls a handler would
 * otherwise carry: whichever keys the schema declares become decorators, and
 * the ones it omits are simply not applied. Responses are keyed by status
 * code and emitted as `@ApiResponse({ status, ... })`.
 *
 * @param schema - The endpoint's entry in its module's `<MODULE>_SWAGGER` object.
 * @param responseType - Response body class, attached to the schema's 2xx
 *   entry. Passed here rather than named in the schema because a
 *   `<module>.swagger.ts` importing a DTO would close a cycle — the DTOs
 *   import `<MODULE>_PROPERTY_SWAGGER` back out of that same file, and the
 *   half-initialised module would leave `@ApiProperty` reading `undefined`.
 * @returns A single method decorator equivalent to all of them combined.
 */
export function SwaggerDocs(
  schema: ISwaggerEndpoint,
  responseType?: SwaggerResponseType,
): MethodDecorator & ClassDecorator {
  const decorators: MethodDecorator[] = [ApiOperation(schema.operation)];

  if (schema.security) {
    decorators.push(ApiSecurity(schema.security));
  }
  for (const param of schema.params ?? []) {
    decorators.push(ApiParam(param));
  }

  for (const [status, response] of Object.entries(schema.responses)) {
    const statusCode = Number(status);
    const responseOptions = response as ApiResponseOptions;
    const responseTypeField =
      responseType && documentsSuccess(statusCode)
        ? { type: responseType }
        : {};

    decorators.push(
      ApiResponse({
        status: statusCode,
        ...responseOptions,
        ...responseTypeField,
      }),
    );
  }

  return applyDecorators(...decorators);
}

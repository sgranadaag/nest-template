import type { ApiOperationOptions, ApiParamOptions } from '@nestjs/swagger';

export interface ISwaggerResponse {
  readonly description: string;
  readonly schema?: Readonly<Record<string, unknown>>;
}

export interface ISwaggerEndpoint {
  readonly operation: ApiOperationOptions;
  readonly security?: string;
  readonly params?: readonly ApiParamOptions[];
  readonly responses: Readonly<Record<number, ISwaggerResponse>>;
}

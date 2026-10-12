import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  extractErrorMessage,
  extractErrorName,
  extractStatusCode,
} from '@utils/http.util';

describe('extractStatusCode', () => {
  it.each([
    [new NotFoundException(), HttpStatus.NOT_FOUND],
    [new BadRequestException(), HttpStatus.BAD_REQUEST],
    [new Error('boom'), HttpStatus.INTERNAL_SERVER_ERROR],
    ['not an error', HttpStatus.INTERNAL_SERVER_ERROR],
  ])('answers %p with %p', (exception, expected) => {
    expect(extractStatusCode(exception)).toBe(expected);
  });
});

describe('extractErrorMessage', () => {
  it.each([
    [new NotFoundException('Order 1 not found'), 'Order 1 not found'],
    [
      new BadRequestException(['a is empty', 'b is empty']),
      'a is empty, b is empty',
    ],
    [new Error('boom'), 'boom'],
    [undefined, 'Internal server error'],
  ])('reads the message of %p', (exception, expected) => {
    expect(extractErrorMessage(exception)).toBe(expected);
  });
});

describe('extractErrorName', () => {
  it.each([
    [
      new NotFoundException('Order 1 not found'),
      HttpStatus.NOT_FOUND,
      'Not Found',
    ],
    [new NotFoundException(), HttpStatus.NOT_FOUND, 'NOT_FOUND'],
    [
      new Error('boom'),
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR',
    ],
  ])('names %p', (exception, statusCode, expected) => {
    expect(extractErrorName(exception, statusCode)).toBe(expected);
  });
});

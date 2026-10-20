import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { MetaDto } from '../dto/pagination.dto.js';
import { ErrorDetailDto, ErrorResponseDto } from '../dto/error.dto.js';
import { ERROR_CODES } from '../constants/error-code.constant.js';
import {
  DEFAULT_ERR_CODE_BY_STATUS,
  DEFAULT_MESSAGE_BY_STATUS,
} from '../filters/global-exception.filter.js';

export const ApiDataResponse = <TModel extends Type<unknown>>(
  status: number,
  model: TModel,
): MethodDecorator =>
  applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      schema: {
        allOf: [{ properties: { data: { $ref: getSchemaPath(model) } } }],
      },
    }),
  );

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
): MethodDecorator =>
  applyDecorators(
    ApiExtraModels(model, MetaDto),
    ApiResponse({
      status: 200,
      schema: {
        allOf: [
          {
            properties: {
              data: { type: 'array', items: { $ref: getSchemaPath(model) } },
              meta: { $ref: getSchemaPath(MetaDto) },
            },
          },
        ],
      },
    }),
  );

export const ApiErrorResponse = (
  status: number,
  description: string,
  details?: Partial<Pick<ErrorDetailDto, 'errCode' | 'field' | 'description'>>,
): MethodDecorator =>
  applyDecorators(
    ApiResponse({
      status,
      description,
      type: ErrorResponseDto,
      example: {
        statusCode: status,
        message: DEFAULT_MESSAGE_BY_STATUS[status] ?? description,
        errors: [
          {
            errCode:
              details?.errCode ??
              DEFAULT_ERR_CODE_BY_STATUS[status] ??
              ERROR_CODES.UNKNOWN_ERROR,
            field: details?.field ?? '',
            message: description,
            description: details?.description ?? description,
          },
        ],
      },
    }),
  );

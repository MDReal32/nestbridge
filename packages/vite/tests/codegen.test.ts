import type { ControllerMethodDefinition } from '@nestbridge/core';
import { describe, expect, it } from 'vitest';
import { generateControllerModule } from '../src/codegen';

const method = (overrides: Partial<ControllerMethodDefinition>): ControllerMethodDefinition => ({
  name: 'findOne',
  httpMethod: 'GET',
  path: '/users/:id',
  parameters: [],
  responseKind: 'json',
  line: 1,
  column: 1,
  ...overrides,
});

const controller = (methods: ControllerMethodDefinition[]) => ({
  name: 'UsersController',
  path: 'users',
  sourceFile: '/fake/users.controller.ts',
  methods,
});

describe('generateControllerModule', () => {
  it('imports request from @nestbridge/runtime and defines a zero-argument constructor', () => {
    const code = generateControllerModule(controller([]));

    expect(code).toContain("import { request } from '@nestbridge/runtime';");
    expect(code).toContain('export class UsersController {');
    expect(code).toContain('constructor() {}');
  });

  it('interpolates a named @Param into the request path', () => {
    const code = generateControllerModule(
      controller([
        method({
          parameters: [
            {
              index: 0,
              kind: 'param',
              name: 'id',
              parameterName: 'id',
            },
          ],
        }),
      ]),
    );

    expect(code).toContain('method: "GET"');
    expect(code).toContain('path: "/users/" + encodeURIComponent(id)');
  });

  it('builds a query object from named @Query parameters', () => {
    const code = generateControllerModule(
      controller([
        method({
          name: 'search',
          path: '/users',
          parameters: [
            {
              index: 0,
              kind: 'query',
              name: 'name',
              parameterName: 'name',
            },
          ],
        }),
      ]),
    );

    expect(code).toContain('query: { "name": name }');
  });

  it('passes a whole @Query object through directly', () => {
    const code = generateControllerModule(
      controller([
        method({
          name: 'filter',
          path: '/users/filter',
          parameters: [
            {
              index: 0,
              kind: 'query',
              parameterName: 'query',
            },
          ],
        }),
      ]),
    );

    expect(code).toContain('query: query');
  });

  it('passes a whole @Body object through directly', () => {
    const code = generateControllerModule(
      controller([
        method({
          name: 'create',
          httpMethod: 'POST',
          path: '/users',
          parameters: [
            {
              index: 0,
              kind: 'body',
              parameterName: 'body',
            },
          ],
        }),
      ]),
    );

    expect(code).toContain('method: "POST"');
    expect(code).toContain('body: body');
  });

  it('builds a headers object from named @Headers parameters', () => {
    const code = generateControllerModule(
      controller([
        method({
          name: 'byHeader',
          path: '/users/by-header',
          parameters: [
            {
              index: 0,
              kind: 'header',
              name: 'x-example',
              parameterName: 'value',
            },
          ],
        }),
      ]),
    );

    expect(code).toContain('headers: { "x-example": value }');
  });

  it('omits query, body, and headers properties when not used', () => {
    const code = generateControllerModule(controller([method({})]));

    expect(code).not.toContain('query:');
    expect(code).not.toContain('body:');
    expect(code).not.toContain('headers:');
  });

  it('requests a blob response for a StreamableFile-returning method', () => {
    const code = generateControllerModule(
      controller([
        method({ name: 'download', path: '/users/:id/download', responseKind: 'stream' }),
      ]),
    );

    expect(code).toContain('responseType: "blob"');
  });

  it('omits responseType for a json-returning method', () => {
    const code = generateControllerModule(controller([method({})]));

    expect(code).not.toContain('responseType:');
  });

  it('omits responseType for an Observable-returning method', () => {
    const code = generateControllerModule(
      controller([method({ name: 'watch', responseKind: 'observable' })]),
    );

    expect(code).not.toContain('responseType:');
  });

  it('orders generated function parameters by declared index', () => {
    const code = generateControllerModule(
      controller([
        method({
          parameters: [
            {
              index: 1,
              kind: 'query',
              name: 'details',
              parameterName: 'details',
            },
            {
              index: 0,
              kind: 'param',
              name: 'id',
              parameterName: 'id',
            },
          ],
        }),
      ]),
    );

    expect(code).toContain('findOne(id, details)');
  });
});

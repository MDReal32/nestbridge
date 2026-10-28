import type { ControllerDefinition, MessageHandlerDefinition } from '@nestbridge/core';
import { describe, expect, it } from 'vitest';
import { generateControllerModule } from '../src/codegen';
import { CONFIG_VIRTUAL_MODULE_ID } from '../src/virtual-modules';

const requested: MessageHandlerDefinition = {
  name: 'handleEmailRequested',
  kind: 'event',
  pattern: 'email.requested',
  payloadParameterIndex: 0,
  line: 1,
  column: 1,
};

const count: MessageHandlerDefinition = {
  name: 'count',
  kind: 'message',
  pattern: { cmd: 'count' },
  payloadParameterIndex: null,
  line: 1,
  column: 1,
};

const controller = (
  overrides: Pick<ControllerDefinition, 'methods' | 'messageHandlers'>,
): ControllerDefinition => ({
  name: 'EmailsController',
  path: 'emails',
  sourceFile: '/fake/emails.controller.ts',
  ...overrides,
});

describe('generateControllerModule with message handlers', () => {
  it('emits HTTP and message methods side by side in one class', () => {
    const code = generateControllerModule(
      controller({
        methods: [
          {
            name: 'list',
            httpMethod: 'GET',
            path: '/emails',
            parameters: [],
            serverOnlyParameterIndexes: [],
            responseKind: 'json',
            line: 1,
            column: 1,
          },
        ],
        messageHandlers: [requested, count],
      }),
      'notifications',
    );

    expect(code).toBe(
      [
        `import '${CONFIG_VIRTUAL_MODULE_ID}';`,
        "import { request } from 'nestbridge';",
        "import { emitMessage, sendMessage } from 'nestbridge/microservices';",
        '',
        'export class EmailsController {',
        '  constructor() {}',
        '',
        '  list() {',
        '    return request({',
        '      method: "GET",',
        '      path: "/emails",',
        '      service: "notifications",',
        '    });',
        '  }',
        '',
        '  handleEmailRequested(payload) {',
        '    return emitMessage({',
        '      service: "notifications",',
        '      pattern: "email.requested",',
        '      payload,',
        '    });',
        '  }',
        '',
        '  count() {',
        '    return sendMessage({',
        '      service: "notifications",',
        '      pattern: {"cmd":"count"},',
        '      payload: {},',
        '    });',
        '  }',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('imports only emitMessage for a class with only events', () => {
    const code = generateControllerModule(
      controller({ methods: [], messageHandlers: [requested] }),
      'notifications',
    );

    expect(code).toContain("import { emitMessage } from 'nestbridge/microservices';");
    expect(code).not.toContain('sendMessage');
  });

  it('imports only sendMessage for a class with only messages', () => {
    const code = generateControllerModule(
      controller({ methods: [], messageHandlers: [count] }),
      'notifications',
    );

    expect(code).toContain("import { sendMessage } from 'nestbridge/microservices';");
    expect(code).not.toContain('emitMessage');
  });

  it('does not import nestbridge/microservices for a class without message handlers', () => {
    const code = generateControllerModule(controller({ methods: [], messageHandlers: [] }));

    expect(code).not.toContain('nestbridge/microservices');
  });

  it('fails when message handlers have no service to address', () => {
    expect(() =>
      generateControllerModule(controller({ methods: [], messageHandlers: [count] })),
    ).toThrow('EmailsController has message handlers');
  });
});

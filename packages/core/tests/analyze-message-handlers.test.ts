import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeControllers } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('analyzeControllers with messagePatterns', () => {
  it('ignores message handlers when messagePatterns is off', () => {
    const { controllers, diagnostics } = analyzeControllers([fixture('emails.controller.ts')]);

    expect(diagnostics).toEqual([]);
    expect(controllers[0]?.messageHandlers).toEqual([]);
    expect(controllers[0]?.methods.map((method) => method.name)).toEqual(['find']);
  });

  it('keeps HTTP routes and message handlers of a mixed controller side by side', () => {
    const { controllers, diagnostics } = analyzeControllers([fixture('emails.controller.ts')], {
      messagePatterns: true,
    });

    expect(diagnostics).toEqual([]);
    expect(controllers[0]?.methods.map((method) => method.name)).toEqual(['find']);
    expect(controllers[0]?.messageHandlers.map((handler) => handler.name)).toEqual([
      'handleEmailRequested',
      'handleLocal',
      'count',
      'sum',
      'numeric',
    ]);
  });

  it.each([
    ['handleEmailRequested', 'event', 'email.requested'],
    ['handleLocal', 'event', 'email.local'],
    ['count', 'message', { cmd: 'email.count', retry: true, version: 2 }],
    ['sum', 'message', { cmd: 'email.sum', exact: false }],
    ['numeric', 'message', 7],
  ])('reads the kind and pattern of %s', (name, kind, pattern) => {
    const { controllers } = analyzeControllers([fixture('emails.controller.ts')], {
      messagePatterns: true,
    });
    const handler = controllers[0]?.messageHandlers.find((candidate) => candidate.name === name);

    expect(handler?.kind).toBe(kind);
    expect(handler?.pattern).toEqual(pattern);
  });

  it.each([
    ['handleEmailRequested', 0],
    ['handleLocal', 0],
    ['count', null],
    ['sum', 1],
    ['numeric', null],
  ])('finds the payload parameter of %s', (name, payloadParameterIndex) => {
    const { controllers } = analyzeControllers([fixture('emails.controller.ts')], {
      messagePatterns: true,
    });
    const handler = controllers[0]?.messageHandlers.find((candidate) => candidate.name === name);

    expect(handler?.payloadParameterIndex).toBe(payloadParameterIndex);
  });

  it('counts a controller with only message handlers and sends no payload once a parameter is decorated', () => {
    const { controllers, diagnostics } = analyzeControllers(
      [fixture('notifications.controller.ts')],
      { messagePatterns: true },
    );

    expect(diagnostics).toEqual([]);
    expect(controllers[0]?.methods).toEqual([]);
    expect(controllers[0]?.messageHandlers).toMatchObject([
      {
        name: 'handleSent',
        kind: 'event',
        pattern: 'notification.sent',
        payloadParameterIndex: 0,
      },
      {
        name: 'pending',
        kind: 'message',
        pattern: 'notification.pending',
        payloadParameterIndex: null,
      },
    ]);
  });

  it('drops a handler whose pattern is not statically known and reports where it is', () => {
    const { controllers, diagnostics } = analyzeControllers(
      [fixture('unsupported-message-pattern.controller.ts')],
      { messagePatterns: true },
    );

    expect(controllers[0]?.messageHandlers.map((handler) => handler.name)).toEqual(['supported']);
    expect(diagnostics.map((diagnostic) => [diagnostic.memberName, diagnostic.found])).toEqual([
      ['dynamic', '@EventPattern(dynamicTopic)'],
      ['computed', '@MessagePattern(buildPattern())'],
      ['spread', "@MessagePattern({ ...{ cmd: 'spread' } })"],
      ['missing', '@EventPattern()'],
    ]);
    expect(diagnostics[0]).toMatchObject({
      code: 'unsupported-message-pattern',
      controllerName: 'UnsupportedMessagePatternController',
      filePath: fixture('unsupported-message-pattern.controller.ts'),
      line: 10,
      column: 3,
    });
  });
});

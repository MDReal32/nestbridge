import type { NestBridgeDiagnostic } from './nestbridge-diagnostic';

export const formatDiagnostic = (diagnostic: NestBridgeDiagnostic) => {
  const subject =
    diagnostic.memberName.length > 0
      ? `${diagnostic.controllerName}.${diagnostic.memberName}`
      : diagnostic.controllerName;

  const lines = [`[NestBridge] ${diagnostic.title}`, '', subject, '', diagnostic.detail];

  if (diagnostic.found !== undefined) {
    lines.push('', 'Found:', diagnostic.found);
  }

  if (diagnostic.expected !== undefined) {
    lines.push('', 'Expected:', diagnostic.expected);
  }

  lines.push('', `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}`);

  return lines.join('\n');
};

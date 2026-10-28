import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { DeclarationClaim } from './declaration-claim';
import { lockFile, writeFileAtomically } from './write-file-locked';

export const DECLARATION_CLAIM_FILE_NAME = 'nestbridge-app.json';

const isDeclarationClaim = (value: unknown): value is DeclarationClaim =>
  typeof value === 'object' &&
  value !== null &&
  'caller' in value &&
  typeof value.caller === 'string' &&
  'messagePatterns' in value &&
  typeof value.messagePatterns === 'boolean' &&
  'bootstrap' in value &&
  (typeof value.bootstrap === 'string' || value.bootstrap === null);

const readClaim = (claimPath: string) => {
  if (!existsSync(claimPath)) {
    return undefined;
  }

  const claim: unknown = JSON.parse(readFileSync(claimPath, 'utf-8'));

  if (!isDeclarationClaim(claim)) {
    throw new Error(
      `[NestBridge] ${claimPath} is not a NestBridge declaration claim. Delete it so the next build recreates it.`,
    );
  }

  return claim;
};

const hasSameOptions = (left: DeclarationClaim, right: DeclarationClaim) =>
  left.messagePatterns === right.messagePatterns && left.bootstrap === right.bootstrap;

const serializeClaim = (claim: DeclarationClaim) => `${JSON.stringify(claim, null, 2)}\n`;

/**
 * Records `claim` as the owner of an app's declarations, unless another caller that still exists
 * owns them with options that generate different declarations. That owner's claim is returned, and
 * the caller must not write the declarations.
 */
export const claimDeclarations = (claimPath: string, claim: DeclarationClaim) => {
  mkdirSync(dirname(claimPath), { recursive: true });
  using _lock = lockFile(claimPath);

  const existing = readClaim(claimPath);

  if (existing !== undefined && existing.caller !== claim.caller && existsSync(existing.caller)) {
    return hasSameOptions(existing, claim) ? undefined : existing;
  }

  writeFileAtomically(claimPath, serializeClaim(claim));
  return undefined;
};

import type { DeclarationClaim } from '../declarations';

const describeDifferences = (owner: DeclarationClaim, claim: DeclarationClaim) => {
  const differences: string[] = [];

  if (owner.messagePatterns !== claim.messagePatterns) {
    differences.push(
      `messagePatterns ${owner.messagePatterns} there, ${claim.messagePatterns} here`,
    );
  }

  if (owner.bootstrap !== claim.bootstrap) {
    differences.push(
      `bootstrap ${owner.bootstrap ?? 'none'} there, ${claim.bootstrap ?? 'none'} here`,
    );
  }

  return differences.join('; ');
};

export const describeDeclarationConflict = (
  appName: string | undefined,
  declarationDir: string,
  owner: DeclarationClaim,
  claim: DeclarationClaim,
) => {
  const app = appName === undefined ? 'The app' : `App "${appName}"`;
  const remedy = appName === undefined ? 'give this app a `name`' : 'give this app another `name`';

  return (
    `${app} shares its declarations in ${declarationDir} with the build of ${owner.caller}, ` +
    `which configures it differently (${describeDifferences(owner, claim)}). ` +
    `Builds that use the same app name for the same server must configure it the same way: ` +
    `${remedy}, or match the other build's options. Declarations were not written.`
  );
};

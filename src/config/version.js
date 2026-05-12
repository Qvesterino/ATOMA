export const ATOMA_VERSION = 'v0.1';

export const ATOMA_BUILD_LABEL = ATOMA_VERSION;

export function resolveAtomaBuildLabel({ channel = 'stable', gitHash = '', timestamp = '' } = {}) {
  const components = [];

  if (channel && channel !== 'stable') {
    components.push(channel);
  }

  if (gitHash) {
    components.push(gitHash);
  }

  if (timestamp) {
    components.push(timestamp);
  }

  if (components.length === 0) {
    return ATOMA_VERSION;
  }

  return `${ATOMA_VERSION}-${components.join('-')}`;
}

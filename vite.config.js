import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const useToneStub = env.ATOMA_USE_TONE_STUB === '1';
  const pagesBase =
    env.ATOMA_BASE_PATH ||
    (env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY
      ? `/${env.GITHUB_REPOSITORY.split('/')[1]}/`
      : '/');

  const alias = [
    {
      find: 'three/examples/jsm/utils/BufferGeometryUtils.js',
      replacement: path.resolve(__dirname, 'src/utils/BufferGeometryUtils.js')
    },
    {
      find: /^three$/,
      replacement: path.resolve(__dirname, 'node_modules/three/build/three.module.js')
    }
  ];

  if (useToneStub) {
    alias.push({
      find: /^tone$/,
      replacement: path.resolve(__dirname, 'src/audio/tone-stub.js')
    });
  }

  return {
    base: pagesBase,
    resolve: {
      alias
    }
  };
});

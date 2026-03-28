import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'three/examples/jsm/utils/BufferGeometryUtils.js',
        replacement: path.resolve(__dirname, 'src/utils/BufferGeometryUtils.js')
      },
      {
        find: /^three$/,
        replacement: path.resolve(__dirname, 'three160.mjs')
      },
      {
        find: /^tone$/,
        replacement: path.resolve(__dirname, 'src/audio/tone-stub.js')
      }
    ]
  }
});

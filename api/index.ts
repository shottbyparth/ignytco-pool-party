// Vercel serverless entry point.
// The server is bundled by esbuild to dist/server.cjs (CommonJS).
// We must import it with its exact built path + extension, otherwise
// Node's ESM loader throws ERR_MODULE_NOT_FOUND.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app } = require('../dist/server.cjs');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;

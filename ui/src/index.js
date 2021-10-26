import { fileURLToPath } from 'url';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import path from 'path';

// ESM specific features
// Don't have access to `__dirname` when `type: 'module'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const apiRootDomain = 'https://api.nodeauth.dev';
const UI_PORT = 5000;

const app = fastify();

async function startUI() {
  try {
    app.register(
      fastifyStatic,
      { root: path.join(__dirname, '../public') }
    );

    await app.listen(UI_PORT);
    console.log(`🚀 Server Listening at port: ${UI_PORT}`);
  } catch (error) {
    console.error(error);
  }
}

startUI();

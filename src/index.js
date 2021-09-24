import './env.js';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';

// ESM specific features
// Don't have access to `__dirname` when `type: 'module'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = fastify();

console.log(process.env.MONGO_URL);

// Tell our Fastify App to listen on a specific port
async function startApp() {
  try {
    app.register(fastifyStatic, {
      // pathname
      root: path.join(__dirname, 'public'),
    });
    
    await app.listen(PORT);
    console.log(`🚀 Server Listening at port: ${PORT}`);
  } catch (error) {
    console.error(error);
  }
}

connectDB().then(() => {
  startApp();
});

import https from 'https';
import { fileURLToPath } from 'url';
import fetch from 'cross-fetch';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import path from 'path';

// ESM specific features
// Don't have access to `__dirname` when `type: 'module'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiRootDomain = 'https://api.nodeauth.dev';
const UI_PORT = 5000;

const app = fastify();

async function startUI() {
  try {
    app.register(
      fastifyStatic,
      { root: path.join(__dirname, '../public') }
    );
      
    app.get(
      '/verify/:email/:token',
      {},
      async (request, reply) => {
        try {
          const { email, token } = request.params;
          const verificationData = {
            email,
            token,
          };

          const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
          });

          const response = await fetch(`${apiRootDomain}/api/verify`, {
            method: 'POST',
            body: JSON.stringify(verificationData),
            credentials: 'include',
            agent: httpsAgent,
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
          });

          // Redirect to home route
          if (response.status === 200) {
            return reply.redirect('/');
          }

          reply.code(401).send();
        } catch (error) {
          console.log('error: ', error);
          reply.code(401).send();
        }
      }
    );

    await app.listen(UI_PORT);
    console.log(`🚀 Server Listening at port: ${UI_PORT}`);
  } catch (error) {
    console.error(error);
  }
}

startUI();

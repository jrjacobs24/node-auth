import './env.js';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyCookie from 'fastify-cookie';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';
import { logUserIn } from './accounts/logUserIn.js';
import { getUserFromCookies } from './accounts/user.js';

// ESM specific features
// Don't have access to `__dirname` when `type: 'module'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT;
const app = fastify();

// Tell our Fastify App to listen on a specific port
async function startApp() {
  try {
    app.register(fastifyCookie, { secret: process.env.COOKIE_SIGNATURE });

    app.register(fastifyStatic, {
      // pathname
      root: path.join(__dirname, 'public'),
    });

    app.post('/api/register', {}, async (request, reply) => {
      try {
        const { body: { email, password } } = request;
        const userId = await registerUser(email, password);
      } catch (error) {
        console.error(error);
      }
    });

    app.post('/api/authorize', {}, async (request, reply) => {
      try {
        const { body: { email, password } } = request;
        const { isAuthorized, userID } = await authorizeUser(email, password);

        if (isAuthorized) {
          await logUserIn(userID, request, reply);
          reply.send({
            data: 'User logged in',
          });
        }
        
        reply.send({
          data: 'Auth failed',
        });
      } catch (error) {
        console.error(error);
      }
    });

    app.get('/test', {}, async (request, reply) => {
      try {
        // Verify user login
        const user = await getUserFromCookies(request, reply)
        
        if (user?._id) {
          reply.send({
            data: user,
          });
        } else {
          reply.send({
            data: 'User Lookup Failed'
          })
        }
        
      } catch (error) {
        throw new Error(error);
      }
    });

    await app.listen(port);
    console.log(`🚀 Server Listening at port: ${port}`);
  } catch (error) {
    console.error(error);
  }
}

connectDB().then(() => {
  startApp();
});

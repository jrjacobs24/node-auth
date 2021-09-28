import './env.js';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyCookie from 'fastify-cookie';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';
import { getUserFromCookies, logUserIn, logUserOut } from './accounts/user.js';

// ESM specific features
// Don't have access to `__dirname` when `type: 'module'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT;
const app = fastify();

async function startApp() {
  try {
    // Setup support for cookies and serving static files via Fastify
    app.register(fastifyCookie, { secret: process.env.COOKIE_SIGNATURE });
    app.register(fastifyStatic, { root: path.join(__dirname, 'public') });

    app.post('/api/register', {}, async (request, reply) => {
      try {
        const { body: { email, password } } = request;
        const userID = await registerUser(email, password);

        if (userID) {
          await logUserIn(userID, request, reply);
          reply.send({
            data: {
              status: 'SUCCESS',
              userID,
            },
          });
        }
      } catch (error) {
        console.error(error);
        reply.send({
          data: {
            status: 'FAILED',
            userID,
          },
        });
      }
    });

    app.post('/api/authorize', {}, async (request, reply) => {
      try {
        const { body: { email, password } } = request;
        const { isAuthorized, userID } = await authorizeUser(email, password);

        if (isAuthorized) {
          await logUserIn(userID, request, reply);
          reply.send({
            data: 'SUCCESS',
            userID,
          });
        }
        
        reply.send({
          data: 'FAILED',
          userID
        });
      } catch (error) {
        console.error(error);
      }
    });

    app.post('/api/logout', {}, async (request, reply) => {
      try {
        await logUserOut(request, reply);
        reply.send({ data: 'SUCCESS' });
      } catch (error) {
        console.error(error);
        reply.send({ data: 'FAILED' });
      }
    });

    app.get('/test', {}, async (request, reply) => {
      try {
        // Verify user login
        const user = await getUserFromCookies(request, reply)
        
        if (user?._id) {
          reply.send({ data: user });
        } else {
          reply.send({ data: 'User Lookup Failed' })
        }
        
      } catch (error) {
        throw new Error(error);
      }
    });

    // Tell our Fastify App to listen on a specific port
    await app.listen(port);
    console.log(`🚀 Server Listening at port: ${port}`);
  } catch (error) {
    console.error(error);
  }
}

// Kick it all off
connectDB().then(() => startApp());

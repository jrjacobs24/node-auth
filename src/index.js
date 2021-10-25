import './env.js';
import { fastify } from 'fastify';
// import fastifyStatic from 'fastify-static';
import fastifyCookie from 'fastify-cookie';
import fastifyCORS from 'fastify-cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';
import { getUserFromCookies, logUserIn, logUserOut } from './accounts/user.js';
import { sendEmail, mailInit } from './mail/index.js';
import { createVerifyEmailLink } from './accounts/verify.js';

// ESM specific features
// Don't have access to `__dirname` when `type: 'module'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { PORT, ROOT_DOMAIN, COOKIE_SIGNATURE } = process.env;
const app = fastify();

/**
 * Setup support for cookies, serving static files, and our CORS policy via Fastify
 * 
 * @returns {void}
 */
function registerFastifySupport() {
  const origin = new RegExp(`(.)?${ROOT_DOMAIN}`);

  app.register(fastifyCookie, { secret: COOKIE_SIGNATURE });
  // app.register(fastifyStatic, { root: path.join(__dirname, 'public') });
  app.register(fastifyCORS, {
    origin,
    credentials: true,
  });
}

async function startApp() {
  try {
    await mailInit();

    registerFastifySupport();

    app.post('/api/register', {}, async (request, reply) => {
      try {
        const { body: { email, password } } = request;
        const userID = await registerUser(email, password);

        // If account creation was successful
        if (userID) {
          const emailLink = await createVerifyEmailLink(email);
          await sendEmail({
            to: email,
            subject: 'Verify your email',
            html: `<a href="${emailLink}">Verify</a>`,
          });

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
    await app.listen(PORT);
    console.log(`🚀 Server Listening at port: ${PORT}`);
  } catch (error) {
    console.error(error);
  }
}

// Kick it all off
connectDB().then(() => startApp());

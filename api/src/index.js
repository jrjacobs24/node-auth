import './env.js';
import { fastify } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifyCORS from 'fastify-cors';
import { connectDB } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';
import { getUserFromCookies, logUserIn, logUserOut, changePassword } from './accounts/user.js';
import { sendEmail, mailInit } from './mail/index.js';
import { createVerifyEmailLink, validateVerifyEmail } from './accounts/verify.js';

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
  app.register(fastifyCORS, {
    origin,
    credentials: true,
  });
}

/**
 * Setup our API endpoints
 */
function registerEndpoints() {
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

  app.post('/api/verify', {}, async (request, reply) => {
    try {
      const { email, token } = request.body;
      const isValid = await validateVerifyEmail(token, email);

      if (isValid) {
        return reply.code(200).send();
      }

      // Un-Authorized
      return reply.code(401).send();
    } catch (error) {
      console.log('error: ', error);
      return reply.code(401).send();
    }
  });

  app.post('/api/change-password', {}, async (request, reply) => {
    try {
      // Verity user login via cookies
      const user = await getUserFromCookies(request, reply);
      const { oldPassword, newPassword } = request?.body;

      if (user?.email) {
        // Compare current logged in user with form to re-authorize
        const {
          isAuthorized,
          userID
        } = await authorizeUser(user.email?.address, oldPassword);
  
        // Update password in db
        if (isAuthorized) {
          await changePassword(userID, newPassword);
          return reply.code(200).send();
        }
      }

      return reply.code(401).send();
    } catch (error) {
      console.log('error: ', error);
      return reply.code(401).send();
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
}

async function startApp() {
  try {
    await mailInit();
    registerFastifySupport();
    registerEndpoints();

    // Tell our Fastify App to listen on a specific port
    await app.listen(PORT);
    console.log(`🚀 Server Listening at port: ${PORT}`);
  } catch (error) {
    console.error(error);
  }
}

// Kick it all off
connectDB().then(() => startApp());

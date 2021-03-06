import mongo from 'mongodb';
import jwt from "jsonwebtoken";
import { refreshTokens } from './tokens.js';
import { createSession } from './session.js';
import { hashPassword } from './register.js';

const { ObjectId } = mongo;

const { JWT_SIGNATURE, ROOT_DOMAIN } = process.env;

/**
 * @typedef User
 * @property {mongo.ObjectId} _id
 * @property {{address: string, verified: boolean}} email
 * @property {string} password
 */

/**
 * Fetch a user based on accessToken. If accessToken doesn't exist, check for a valid refresh token
 * and session. If so, refresh the user's access token and return the user.
 * 
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 * @returns {User}
 */
export async function getUserFromCookies(request, reply) {
  try {
    const { user } = await import('../user/user.js');
    const { session } = await import('../session/session.js');

    // Check to make sure access token exists
    if (request?.cookies?.accessToken) {
      const { accessToken } = request.cookies;
      
      // Verify access token
      const decodedAccessToken = jwt.verify(accessToken, JWT_SIGNATURE);
      
      // Return user from record
      return user.findOne({
        _id: ObjectId(decodedAccessToken?.userID),
      });
    }
    
    if (request?.cookies?.refreshToken) {
      // Get the access and refresh tokens
      const { refreshToken } = request.cookies;

      // Decode refresh token
      const { sessionToken } = jwt.verify(refreshToken, JWT_SIGNATURE);

      // Look up session
      const currentSession = await session.findOne({ sessionToken });

      // Confirm session is valid
      if (currentSession.valid) {
        // Look up current user
        const currentUser = await user.findOne({
          _id: ObjectId(currentSession.userID)
        });

        // Refresh Tokens
        await refreshTokens(sessionToken, currentUser._id, reply);

        // Return current user
        return currentUser;
      }
    }
  } catch (error) {
    console.error(error);
  }
}


/**
 * Delete the user's session and clear their refresh and access tokens
 * 
 * @async
 * @param {mongo.ObjectId} userID
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 */
export async function logUserIn(userID, request, reply) {
  const connectionInfo = {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  };

  const sessionToken = await createSession(userID, connectionInfo);
  await refreshTokens(sessionToken, userID, reply);
}

/**
 * Delete the user's session and clear their refresh and access tokens
 * 
 * @async
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 */
export async function logUserOut(request, reply) {
  try {
    const { session } = await import('../session/session.js');

    if (request?.cookies?.refreshToken) {
      const { refreshToken } = request.cookies;
      const { sessionToken } = jwt.verify(refreshToken, JWT_SIGNATURE);

      // Delete db record for session
      await session.deleteOne({ sessionToken });
    }

    // Remove Cookies
    reply
      .clearCookie('refreshToken', {
        path: '/',
        domain: ROOT_DOMAIN,
        httpOnly: true,
        secure: true,
      })
      .clearCookie('accessToken', {
        path: '/',
        domain: ROOT_DOMAIN,
        httpOnly: true,
        secure: true,
      });
  } catch (error) {
    console.error(error);
  }
}

/**
 * Update the password on a user in our database
 * 
 * @async
 * @param {mongo.ObjectId} userID 
 * @param {string} newPassword 
 * @returns {Promise<import('mongodb').UpdateResult>}
 */
export async function changePassword(userID, newPassword) {
  try {
    const { user } = await import('../user/user.js');
    const hashedPassword = await hashPassword(newPassword);

    return user.updateOne({
      _id: userID,
    }, {
      $set: {
        password: hashedPassword,
      },
    });
  } catch (error) {
    console.log('error: ', error);
    
  }
}

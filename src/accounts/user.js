import mongo from 'mongodb';
import jwt from "jsonwebtoken";
import { refreshTokens } from './tokens.js';
import { createSession } from './session.js';

const { ObjectId } = mongo;

const JWTSignature = process.env.JWT_SIGNATURE;

export async function getUserFromCookies(request, reply) {
  try {
    const { user } = await import('../user/user.js');
    const { session } = await import('../session/session.js');

    // Check to make sure access token exists
    if (request?.cookies?.accessToken) {
      const { accessToken } = request.cookies;
      
      // Decode access token
      const decodedAccessToken = jwt.verify(accessToken, JWTSignature);
      console.log('decodedAccessToken: ', decodedAccessToken);
      
      // Return user from record
      return user.findOne({
        _id: ObjectId(decodedAccessToken?.userID),
      });
    }
    
    if (request?.cookies?.refreshToken) {
      // Get the access and refresh tokens
      const { refreshToken } = request.cookies;

      // Decode refresh token
      const { sessionToken } = jwt.verify(refreshToken, JWTSignature);

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
      const { sessionToken } = jwt.verify(refreshToken, JWTSignature);

      // Delete db record for session
      await session.deleteOne({ sessionToken });
    }

    // Remove Cookies
    reply
      .clearCookie('refreshToken')
      .clearCookie('accessToken');
  } catch (error) {
    console.error(error);
  }
}

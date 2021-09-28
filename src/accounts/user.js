import mongo from 'mongodb';
import jwt from "jsonwebtoken";
import { createTokens } from './tokens.js';

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

export async function refreshTokens(sessionToken, userID, reply) {
  try {
    // Create tokens
    const { accessToken, refreshToken } = await createTokens(sessionToken, userID);

    // TODO: Extract all of this into a separate function and update here and logUserIn.js
    // Set the Cookies
    const now = new Date();

    // Get date, 30 days in the future
    const refreshExpires = now.setDate(now.getDate() + 30);
    reply
      .setCookie('refreshToken', refreshToken, {
        path: '/', // root of site
        domain: 'localhost',
        httpOnly: true,
        expires: refreshExpires,
      })
      .setCookie('accessToken', accessToken, {
        path: '/', // root of site
        domain: 'localhost',
        httpOnly: true,
      });
  } catch (error) {
    console.error(error);
  }
}
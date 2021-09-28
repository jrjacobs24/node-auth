import mongo from 'mongodb';
import jwt from "jsonwebtoken";

const { ObjectId } = mongo;

const JWTSignature = process.env.JWT_SIGNATURE;

export async function getUserFromCookies(request) {
  try {
    const { user } = await import('../user/user.js');

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

    // Get the access and refresh tokens


    // If no access token
    // Decode refresh token
    // Look up session
    // Confirm session is valid
    // If session is valid,
    // Refresh Tokens
    // Return current user

  } catch (error) {
    console.error(error);
  }
}

export async function refreshTokens() {
  try {
    
  } catch (error) {
    console.error(error);
  }
}
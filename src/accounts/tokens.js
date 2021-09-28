import jwt from "jsonwebtoken";

const JWTSignature = process.env.JWT_SIGNATURE;

export async function createTokens(sessionToken, userID) {
  try {
    const refreshToken = jwt.sign({ sessionToken }, JWTSignature);
    const accessToken = jwt.sign({ sessionToken, userID }, JWTSignature);

    return { refreshToken, accessToken };
  } catch (error) {
    console.error(error);   
  }
}
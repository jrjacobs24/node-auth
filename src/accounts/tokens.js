import jwt from "jsonwebtoken";

const { JWT_SIGNATURE, ROOT_DOMAIN } = process.env;

export async function createTokens(sessionToken, userID) {
  try {
    const refreshToken = jwt.sign({ sessionToken }, JWT_SIGNATURE);
    const accessToken = jwt.sign({ sessionToken, userID }, JWT_SIGNATURE);

    return { refreshToken, accessToken };
  } catch (error) {
    console.error(error);   
  }
}

export async function refreshTokens(sessionToken, userID, reply) {
  try {
    // Create the JWT
    const { accessToken, refreshToken } = await createTokens(sessionToken, userID);

    // Set the Cookies
    const now = new Date();

    // Get date, 30 days in the future
    const refreshExpires = now.setDate(now.getDate() + 30);
    reply
      .setCookie('refreshToken', refreshToken, {
        path: '/', // root of site
        domain: ROOT_DOMAIN,
        httpOnly: true,
        secure: true,
        expires: refreshExpires,
      })
      .setCookie('accessToken', accessToken, {
        path: '/', // root of site
        domain: ROOT_DOMAIN,
        httpOnly: true,
        secure: true,
      });
  } catch (error) {
    console.error(error);
  }
}

import { createSession } from "./session.js";
import { createTokens } from "./tokens.js";

export async function logUserIn(userID, request, reply) {
  const connectionInfo = {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  };

  // Create session
  const sessionToken = await createSession(userID, connectionInfo);
  console.log('sessionToken: ', sessionToken);

  // Create the JWT
  const { accessToken, refreshToken } = await createTokens(sessionToken, userID);

  
  // Set the Cookies
  const now = new Date();
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
}
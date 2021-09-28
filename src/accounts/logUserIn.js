import { createSession } from "./session.js";

export async function logUserIn(userID, request, reply) {
  const connectionInfo = {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  };

  // Create session
  const sessionToken = await createSession(userID, connectionInfo);
  console.log('sessionToken: ', sessionToken);

  // Create the JWT

  // Set the Cookies
}
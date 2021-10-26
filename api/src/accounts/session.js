import { randomBytes } from 'crypto'; // Comes from nodejs

export async function createSession(userID, connection) {
  try {
    // Generate a session token
    const sessionToken = randomBytes(42).toString('hex');
  
    // Retrieve connection information (user agent, IP, etc)
    const { ip, userAgent } = connection;
  
    // Database insert for session
    const { session } = await import('../session/session.js');
    await session.insertOne({
      sessionToken,
      userID,
      valid: true,
      userAgent,
      ip,
      updatedAt: new Date(),
      createdAt: new Date(),
    });
  
    // Return session token
    return sessionToken;
  } catch (error) {
    throw new Error('Session Creation Failed');
  }
}
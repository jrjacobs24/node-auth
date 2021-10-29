import crypto from 'crypto';

const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

export async function createVerifyEmailToken(email) {
  try {
    const authString = `${JWT_SIGNATURE}:${email}`;
    
    return crypto.createHash('sha256').update(authString).digest('hex');
  } catch (error) {
    console.error(error);
  }
}

export async function createVerifyEmailLink(email) {
  try {
    const emailToken = await createVerifyEmailToken(email);
    const URIencodedEmail = encodeURIComponent(email);

    return `https://${ROOT_DOMAIN}/verify/${URIencodedEmail}/${emailToken}`;
  } catch (error) {
    console.error(error);
  }
}

export async function validateVerifyEmail(token, email) {
  try {
    // Create a hash (aka token)
    const emailToken = await createVerifyEmailToken(email);
    const isValid = emailToken === token;

    if (isValid) {
      // Update user to make them verified
      const { user } = await import('../user/user.js');
      await user.updateOne({
        'email.address': email,
      }, {
        // `$set` - Mongo-specific pattern when updating a singular field value in a document
        $set: { 'email.verified': true },
      });

      return true;
    }

    return false;
  } catch (error) {
    console.log('error: ', error);
    return false;
  }
}
import bcrypt from "bcryptjs";

const { genSalt, hash } = bcrypt;

export async function registerUser(email, password) {
  // Prevent import race condition
  const { user } = await import('../user/user.js');

  // Generate salt - 12 rounds is typically considered as "secure"
  const salt = await genSalt(12);

  // Hash with salt
  const hashedPassword = await hash(password, salt);

  // Store in database
  const result = await user.insertOne({
    email: {
      address: email,
      verified: false,
    },
    password: hashedPassword,
  });

  // Return user from database
  return result.insertedId;
}
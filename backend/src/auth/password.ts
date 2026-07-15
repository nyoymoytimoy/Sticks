import bcrypt from "bcryptjs";

export function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

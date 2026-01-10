
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'manifest-architect-super-secret-key-32';
const KEY = scryptSync(SECRET_KEY, 'salt', 32);

export class CryptoUtil {
  static encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  static decrypt(hash: string): string {
    const [iv, tag, content] = hash.split(':');
    const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(content, 'hex')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  }
}

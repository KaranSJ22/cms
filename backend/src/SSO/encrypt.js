const crypto = require('node:crypto');

// Must be exactly 32 bytes (256 bits) for aes-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'v-secret-key-32-characters-long'; 
const IV_LENGTH = 16; // For AES, this is always 16 bytes

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to the encrypted text so it can be retrieved during decryption
    return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

module.exports = { encrypt, decrypt };

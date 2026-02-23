const input = "VwBCIEIOdG2tOWMMwR2uRXdaWSsduRYAfzblL5mix6TAufU2o8.";
const cleanInput = input.replace('.', ''); // Remove trailing dot

// Standard PKCS#8 prefix for Ed25519 is 16 bytes:
// Base64: MC4CAQAwBQYDK2VwBCIEI
// Hex: 302e020100300506032b657004220420
const prefix = "MC4CAQAwBQYDK2";
let keyPart = cleanInput;

if (cleanInput.startsWith("VwBCIEI")) {
    // It looks like the string the user copied includes the last 5 bytes of the prefix ("VwBCIEI")
}

const fullB64 = prefix + cleanInput;

const pem = `-----BEGIN PRIVATE KEY-----\n${fullB64}\n-----END PRIVATE KEY-----`;

console.log("\n=== PASTE THIS EXACT TEXT INTO VERCEL Environment Variables ===");
console.log("\n1. AS RAW PEM (if it keeps the newlines):\n");
console.log(pem);

console.log("\n2. OR AS A SINGLE LINE BASE64 (if Vercel squashes newlines):\n");
console.log(Buffer.from(pem).toString("base64"));
console.log("\n=============================================================\n");

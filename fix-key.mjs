import crypto from "crypto";

const input = "VwBCIEIOdG2tOWMMwR2uRXdaWSsduRYAfzblL5mix6TAufU2o8.";
const cleanInput = input.replace('.', ''); // Remove trailing dot

// The standard PKCS#8 header for Ed25519 is:
// 302e020100300506032b657004220420
const prefix = "MC4CAQAwBQYDK2VwBCIEI";

// It looks like the user's string "VwBCIEIOdG..." overlaps with the end of the prefix.
// The standard prefix ends with "VwBCIEI".
// Let's extract the actual 32-byte private key part.

let privateKeyB64;
if (cleanInput.startsWith("VwBCIEI")) {
  privateKeyB64 = cleanInput.substring(7); // "OdG2tOWMMwR2uRXdaWSsduRYAfzblL5mix6TAufU2o8"
} else {
  privateKeyB64 = cleanInput;
}

// Add padding if necessary
while (privateKeyB64.length % 4 !== 0) {
    privateKeyB64 += "=";
}

const fullB64 = prefix + privateKeyB64;

const pem = `-----BEGIN PRIVATE KEY-----\n${fullB64}\n-----END PRIVATE KEY-----`;

console.log("\n=== PASTE THIS EXACT TEXT INTO VERCEL Environment Variables ===");
console.log("\n1. AS RAW PEM (if it keeps the newlines):\n");
console.log(pem);

console.log("\n2. OR AS A SINGLE LINE BASE64 (if Vercel squashes newlines):\n");
console.log(Buffer.from(pem).toString("base64"));
console.log("\n=============================================================\n");

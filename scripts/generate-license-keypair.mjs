#!/usr/bin/env node
/**
 * ORAYA LICENSE KEYPAIR GENERATOR
 * 
 * Generates an Ed25519 keypair for license token signing.
 * 
 * Usage:
 *   node scripts/generate-license-keypair.mjs
 * 
 * Output:
 *   - Prints the PEM-format private key (for LICENSE_SIGNING_PRIVATE_KEY env var)
 *   - Prints the PEM-format public key (to embed in the desktop app's keys.rs)
 *   - Prints the base64-encoded private key (for Vercel env vars)
 * 
 * IMPORTANT: 
 *   1. Copy the private key PEM into your .env.local as LICENSE_SIGNING_PRIVATE_KEY
 *   2. Copy the public key PEM into src-tauri/src/license/keys.rs
 *   3. NEVER commit the private key to git
 */

import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';

async function main() {
    console.log('🔑 Generating Ed25519 keypair for Oraya License Signing...\n');

    const { publicKey, privateKey } = await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
    });

    const privatePem = await exportPKCS8(privateKey);
    const publicPem = await exportSPKI(publicKey);

    console.log('━'.repeat(70));
    console.log('PRIVATE KEY (SaaS server only — NEVER commit to git!)');
    console.log('━'.repeat(70));
    console.log(privatePem);

    console.log('━'.repeat(70));
    console.log('PUBLIC KEY (embed in desktop app — src-tauri/src/license/keys.rs)');
    console.log('━'.repeat(70));
    console.log(publicPem);

    // Base64-encoded version for environments that don't support newlines
    const privateBase64 = Buffer.from(privatePem).toString('base64');
    console.log('━'.repeat(70));
    console.log('BASE64-ENCODED PRIVATE KEY (for Vercel / Railway env vars)');
    console.log('━'.repeat(70));
    console.log(privateBase64);

    console.log('\n━'.repeat(70));
    console.log('📋 SETUP INSTRUCTIONS:');
    console.log('━'.repeat(70));
    console.log('');
    console.log('1. Add to .env.local (SaaS):');
    console.log('   LICENSE_SIGNING_PRIVATE_KEY="<paste PEM above>"');
    console.log('');
    console.log('2. Add to Vercel env vars:');
    console.log('   LICENSE_SIGNING_PRIVATE_KEY = <paste BASE64 above>');
    console.log('');
    console.log('3. Update desktop app keys.rs with the PUBLIC KEY PEM above');
    console.log('   (replace PUBLIC_KEY_V1_PEM constant)');
    console.log('');
    console.log('4. Set the key ID env var (optional, defaults to "v1"):');
    console.log('   LICENSE_SIGNING_KEY_ID=v1');
    console.log('');
}

main().catch(console.error);

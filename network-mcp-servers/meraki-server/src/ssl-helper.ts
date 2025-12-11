import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

/**
 * Trust a custom CA certificate for all outgoing HTTPS requests.
 * Usage: call at the top of your entry file (e.g., index.ts)
 * @param caPathEnv - The env var containing the CA path, defaults to 'ZSCALER_CA_PATH'
 */
export function trustCustomCA(caPathEnv: string = 'ZSCALER_CA_PATH'): void {
    const caPath = process.env[caPathEnv];
    if (caPath && fs.existsSync(caPath)) {
        try {
            const ca = fs.readFileSync(caPath);
            // Extend the global HTTPS agent options
            const globalAgent = https.globalAgent as any;
            globalAgent.options.ca = ca;

            // Also potentially set NODE_EXTRA_CA_CERTS (though handled by Node if set before startup)
            // This programmatic method ensures it applies even if env var was set late
            process.env.NODE_EXTRA_CA_CERTS = caPath;

            console.error(`[ssl-helper] Using custom CA: ${caPath}`);
        } catch (err) {
            console.error(`[ssl-helper] Failed to load CA from ${caPath}:`, err);
        }
    }
}

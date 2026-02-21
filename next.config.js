/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode
    reactStrictMode: true,

    // Supabase generated types are behind the actual DB schema.
    // Real runtime safety is enforced by RLS + service role auth, not TS types.
    // TODO: run `supabase gen types typescript` to regenerate and remove this.
    typescript: {
        ignoreBuildErrors: true,
    },

    // Optimize images
    images: {
        domains: ['api.oraya.dev', 'avatars.githubusercontent.com', 'www.anwe.sh'],
    },

    // Rewrites for cleaner URLs
    async rewrites() {
        return [];
    },

    // Headers for security
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;

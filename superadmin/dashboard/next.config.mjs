/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Optimize images
    images: {
        domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
        formats: ['image/avif', 'image/webp'],
    },

    // Environment variables available at build time
    env: {
        NEXT_PUBLIC_APP_NAME: 'Oraya Platform',
        NEXT_PUBLIC_APP_VERSION: '3.0.2',
    },

    // Production optimizations
    compiler: {
        // Remove console.log in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Transpile specific packages if needed
    transpilePackages: [],

    // Headers for security
    async headers() {
        return [
            {
                source: '/(.*)',
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
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;

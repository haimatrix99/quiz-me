/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.in',
                pathname: '**',
            },
        ],
    }
}

module.exports = nextConfig

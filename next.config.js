/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.FLUENTFFMPEG_COV': false
            })
        )

        return config
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'utfs.io',
                pathname: '**',
            },
        ],
    },
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
}

module.exports = nextConfig

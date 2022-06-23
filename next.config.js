/** @type {import('next').NextConfig} */

const { baseURL, basePath, mode } = require('./config')

module.exports = {
	reactStrictMode: true,
	trailingSlash: true,
	basePath,
	assetPrefix: baseURL + basePath,
	images: {
		loader: mode === 'dev' ? 'akamai' : 'imgix',
		path: baseURL + basePath,
	},
	webpack: (config) => {
		config.resolve.alias['@'] = require('path').resolve('.')
		config.resolve.fallback = {
			process: false,
			net: false,
			zlib: false,
			stream: false,
			tls: false,
			crypto: false,
			http: false,
			https: false,
			fs: false,
			path: false,
			os: false,
		}
		return config
	},
}

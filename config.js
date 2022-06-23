const mode = 'github'

let baseURL = '',
	basePath = ''

switch (mode) {
	case 'github':
		baseURL = 'https://neoburger.io'
		break
	case 'server':
		baseURL = 'http://127.0.0.1:80'
		break
	default:
		baseURL = '/'
		break
}

module.exports = {
	mode,
	baseURL,
	basePath,
}

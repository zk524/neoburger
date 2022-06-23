export const languages = ['en', 'zh']

export const defaultLanguage = 'en'

export const namespaces = ['home', 'airdrop', 'burgerStation', 'dashboard', 'governance', 'jazzUp', 'treasury']

export const defaultNamespace = 'home'

export function getAllLanguageSlugs() {
	return languages.map((lang) => {
		return { params: { lang: lang, test: 1 } }
	})
}

export function getLanguage(lang) {
	return languages.includes(lang) ? lang : defaultLanguage
}

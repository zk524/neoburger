import i18next from 'i18next'
import { languages, defaultLanguage, namespaces, defaultNamespace } from './config'

const locales = languages.reduce(
	(lo, language) => ({
		...lo,
		[language]: namespaces.reduce(
			(ns, namespace) => ({
				...ns,
				[namespace]: require('@/resources/locales/' + language + '/' + namespace + '.json'),
			}),
			{}
		),
	}),
	{}
)

i18next.init({
	fallbackLng: defaultLanguage,
	resources: locales,
	ns: namespaces,
	defaultNS: defaultNamespace,
	returnObjects: true,
	debug: false,
	interpolation: {
		escapeValue: false, // Not needed for React
	},
	react: {
		wait: true,
	},
})

export default i18next

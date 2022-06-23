import { getLanguage } from '@/resources/i18n/config'

const URLGen = (path: string, lang: string = '') => `/${getLanguage(lang)}/${path}`

export default URLGen

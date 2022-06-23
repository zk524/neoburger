import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { defaultLanguage } from '@/resources/i18n/config'
import URLGen from '@/resources/utils/URLGen'

function Index() {
	const router = useRouter()
	useEffect(() => {
		router.replace(URLGen('home', defaultLanguage))
	}, []) //eslint-disable-line react-hooks/exhaustive-deps

	return null
}

export default Index

import '@/styles/globals.css'
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { initWalletApi } from '@/resources/utils/api/walletApi'
// import { ErrorHandlder } from '@/components/ErrorHandler';
import Drawer from '@/components/Drawer'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { store } from '@/store'

import '@/resources/i18n/init'
import i18next from 'i18next'
import { basePath } from '../config'

function App({ Component, pageProps }: any) {
	i18next.changeLanguage(pageProps.language)
	const [showDrawer, setShowDrawer] = useState(false) // 是否拉开抽屉
	useEffect(() => {
		// 初始化dapi
		initWalletApi()
	}, [])

	return (
		<>
			<Head>
				<title>NeoBurger</title>
				<meta
					content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;'
					name='viewport'
				/>
				<meta name='description' content='NeoBurger' />
				<link rel='shortcut icon' type='image/x-icon' href={`${basePath}/favicon.ico`}></link>
			</Head>
			<Provider store={store}>
				{/* <ErrorHandlder /> */}
				<Header setShowDrawer={setShowDrawer} {...pageProps} />
				<Component {...pageProps} setShowDrawer={setShowDrawer} />
				<Footer />
				<Drawer visible={showDrawer} hide={() => setShowDrawer(false)} {...pageProps} />
			</Provider>
		</>
	)
}

export default App

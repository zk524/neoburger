import { FC, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import i18next from 'i18next'
import { getAllLanguageSlugs, getLanguage } from '@/resources/i18n/config'
import URLGen from '@/resources/utils/URLGen'
import Link from 'next/link'
import Wallet from '../Wallet'
import neoBurgerLogoBlack from '@/resources/images/neo-burger-logo-black.svg'
import neoBurgerLogoWhite from '@/resources/images/neo-burger-logo-white.svg'
import burgerWhite from '@/resources/images/burger-white.svg'
import rightArrow from '@/resources/images/right-arrow.svg'
import menu from '@/resources/images/menu.svg'
import menuDark from '@/resources/images/menu-dark.svg'
import style_pc from './Header.pc.module.css'
import style_mobole from './Header.mobile.module.css'
import { isMobile } from 'react-device-detect'

interface Props {
	setShowDrawer: (show: boolean) => void
	language: string
}

const Header: FC<Props> = ({ setShowDrawer, language }) => {
	const { t } = i18next
	const router = useRouter()
	const [color, setColor] = useState(router.pathname.includes('/home') ? 'white' : 'black')
	const [style, setStyle]: any = useState(style_pc)
	const changeLanguage = (locale: string) => {
		router.replace(URLGen(router.asPath.split('/').slice(-2)[0], locale))
	}

	useEffect(() => {
		setStyle(isMobile ? style_mobole : style_pc)
	}, [])

	useEffect(() => {
		function changeColor() {
			const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
			let threshold = 415
			if (document.body.clientWidth > 900) {
				threshold = 415
			} else if (document.body.clientWidth > 800) {
				threshold = 1350
			} else if (document.body.clientWidth > 700) {
				threshold = 1100
			} else if (document.body.clientWidth > 350) {
				threshold = 750
			}
			if (scrollTop >= threshold && color !== 'black') {
				setColor('black')
			} else if (scrollTop < threshold && color !== 'white') {
				setColor('white')
			}
		}
		if (router.pathname.includes('/home')) {
			changeColor()
			window.onscroll = () => {
				changeColor()
			}
		} else {
			setColor('black')
		}
	}, [router, color])

	return (
		<header className={`${style.header} ${color === 'white' ? style.white : `${style.black} ${style.boxShadow}`}`}>
			{/* <div className={style.topTip}>
				<Image src={burgerWhite} alt='burgerWhite' />
				<span className={style.airdropText}>NoBug Airdrop is available now ! </span>
				<button className={style.claimBtn} onClick={() => router.replace(URLGen('airdrop', language))}>
					<span>Claim </span>
					<Image src={rightArrow} alt='rightArrow' />
				</button>
			</div> */}
			<div className={style.headerContent}>
				<div className={style.mNeoburgerLogo} onClick={() => router.replace(URLGen('home', language))}>
					<Image src={color === 'white' ? neoBurgerLogoWhite : neoBurgerLogoBlack} alt='NeoBurger Logo' />
				</div>
				<div className={style.menu} onClick={() => setShowDrawer(true)}>
					<Image src={color === 'white' ? menu : menuDark} alt='menu' />
				</div>
				<div className={style.headerLink}>
					<Link href={URLGen('home', language)}>
						<a className={`${style.linkFont} ${router.pathname.includes('/home') ? style.bolder : ''}`}>
							{t('home')}
						</a>
					</Link>
				</div>
				<div className={style.pageLink}>
					<Link href={URLGen('airdrop', language)}>
						<a className={`${style.linkFont} ${router.pathname.includes('/airdrop') ? style.bolder : ''}`}>
							{t('airdrop')}
						</a>
					</Link>
				</div>
				{/* <div className={style.pageLink}>
                    <Link
                        href="/governance"
                    >
                        <a className={`${style.linkFont} ${router.pathname === '/governance' ? style.bolder : ''}`}>{t('governance')}</a>
                    </Link>
                </div> */}
				<div className={style.pageLink}>
					<Link href={URLGen('treasury', language)}>
						<a className={`${style.linkFont} ${router.pathname.includes('/treasury') ? style.bolder : ''}`}>
							{t('treasury')}
						</a>
					</Link>
				</div>
				<div className={style.pageLink}>
					<Link href={URLGen('dashboard', language)}>
						<a
							className={`${style.linkFont} ${
								router.pathname.includes('/dashboard') ? style.bolder : ''
							}`}
						>
							{t('dashboard')}
						</a>
					</Link>
				</div>
				<div className={style.pageLink}>
					<a className={style.linkFont} target='_blank' rel='noreferrer' href='https://neoburger.github.io/'>
						{t('doc')}
					</a>
				</div>
				<Wallet className={`${style.walletBtn} ${style.hideInMobile}`} color={color} />
				<div className={style.languageSwitch}>
					<a
						className={`${style.languageBtn} ${language === 'en' && style.bolder}`}
						onClick={() => changeLanguage('en')}
					>
						EN
					</a>
					<span> | </span>
					<a
						className={`${style.languageBtn} ${language === 'zh' && style.bolder}`}
						onClick={() => changeLanguage('zh')}
					>
						中文
					</a>
				</div>
			</div>
		</header>
	)
}

export async function getStaticPaths() {
	const paths = getAllLanguageSlugs()
	return {
		paths,
		fallback: false,
	}
}

export async function getStaticProps({ params }: any) {
	return {
		props: {
			language: getLanguage(params.lang),
		},
	}
}

export default Header

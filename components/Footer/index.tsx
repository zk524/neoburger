import React, { FC, useEffect, useState } from 'react'
import Image from 'next/image'
import i18next from 'i18next'
import neoBurgerDark from '@/resources/images/neo-burger-dark.svg'
import style_pc from './Footer.pc.module.css'
import style_mobile from './Footer.mobile.module.css'
import { isMobile } from 'react-device-detect'
const Footer: FC = () => {
	const { t } = i18next
	const [style, setStyle]: any = useState({})
	useEffect(() => {
		setStyle(isMobile ? style_mobile : style_pc)
	}, [])

	return (
		<footer className={style.footer}>
			<nav>
				<ul className={style.footerMenu}>
					<li className={style.width24}>
						<Image src={neoBurgerDark} alt='neo burger dark' />
					</li>
					<li>
						<a href='https://neoburger.github.io/' className={`${style.footerText} ${style.hideInPC}`}>
							{t('doc')}
						</a>
						<span className={`${style.divider} ${style.hideInPC}`}> | </span>
						<a href='https://neo.org/' className={style.footerText}>
							Neo
						</a>
						<span className={style.divider}> | </span>
						<a href='https://twitter.com/NeoBurger_io' className={style.footerText}>
							Twitter
						</a>
						<span className={style.divider}> | </span>
						<a href='https://github.com/neoburger' className={style.footerText}>
							Github
						</a>
					</li>
				</ul>
			</nav>
		</footer>
	)
}

export default Footer

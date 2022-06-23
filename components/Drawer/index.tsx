import { FC, useRef, useCallback, MouseEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import i18next from 'i18next'
import URLGen from '@/resources/utils/URLGen'
import { useRouter } from 'next/router'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { batchUpdate } from '@/store/features/burger'
import { walletApi } from '@/resources/utils/api/walletApi'
import closeDrawer from '@/resources/images/close-drawer.svg'
import oneGate from '@/resources/images/onegate.svg'
import copy from '@/resources/images/copy.svg'
import style from './Drawer.module.css'

interface Props {
	visible: boolean
	hide: () => void
	language: string
}

const Drawer: FC<Props> = ({ visible, hide, language }) => {
	const { t } = i18next
	const router = useRouter()

	const dispatch = useAppDispatch()
	const address = useAppSelector((state) => state.burger.address) // 钱包地址
	const walletName = useAppSelector((state) => state.burger.walletName) // 连接的钱包名称

	const maskLayer = useRef<HTMLDivElement>(null)

	// 关闭
	const hideDrawer = useCallback(
		(e: MouseEvent) => {
			if (e.target !== maskLayer.current) {
				return
			}
			hide()
		},
		[hide]
	)

	// 连接钱包
	const connectWallet = () => {
		dispatch(batchUpdate({ walletName: 'OneGate' }))
		walletApi['OneGate']?.getAccount()
	}

	const changeLanguage = (locale: string) => {
		router.replace(URLGen(router.asPath.split('/').slice(-2)[0], locale))
	}

	return visible ? (
		<div className={style.mask} ref={maskLayer} onClick={hideDrawer}>
			<div className={style.wrapper}>
				<div className={style.closeBtn} onClick={() => hide()}>
					<Image src={closeDrawer} alt='close' />
				</div>
				{address && walletName === 'OneGate' ? (
					<div className={style.connectInfo}>
						<div className={style.connectHeader}>
							<Image src={oneGate} alt='onegate' width={28} height={28} />
							<span className={style.walletHeaderName}>OneGate</span>
						</div>
						<CopyToClipboard text={address}>
							<div className={style.addressText}>
								<span>{address}</span>
								<span className={style.copyBtn}>
									<Image src={copy} alt='copy' />
								</span>
							</div>
						</CopyToClipboard>
						<button className={style.disconnectBtn} onClick={() => walletApi['OneGate']?.disconnect()}>
							Disconnect
						</button>
					</div>
				) : (
					<button className={style.connectBtn} onClick={() => connectWallet()}>
						<span>{t('connectWallet')}</span>
						<span>
							<Image src={oneGate} alt='onegate' width={32} height={32} />
						</span>
					</button>
				)}

				<a href='https://neoburger.github.io/' className={style.text}>
					{t('doc')}
				</a>
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
		</div>
	) : null
}

export default Drawer

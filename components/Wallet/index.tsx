import { FC, useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import i18next from 'i18next'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { batchUpdate } from '@/store/features/burger'
import { walletApi } from '@/resources/utils/api/walletApi'
import neoline from '@/resources/images/neo-line.svg'
import o3 from '@/resources/images/o3.svg'
import neon from '@/resources/images/neon.svg'
import copy from '@/resources/images/copy.svg'
import style from './Wallet.module.css'

interface Props {
	className?: string
	color: string
}

const Wallet: FC<Props> = ({ className: _className, color }) => {
	const { t } = i18next

	const dispatch = useAppDispatch()
	const address = useAppSelector((state) => state.burger.address) // 钱包地址
	const walletName = useAppSelector((state) => state.burger.walletName) // 连接的钱包名称
	const temporarySwitch = useAppSelector((state) => state.burger.temporarySwitch) // 临时的一个开关，后面会删掉

	const [showWalletList, setShowWalletList] = useState(false) // 是否展示支持的钱包列表
	const [showWalletInfo, setShowWalletInfo] = useState(false) // 是否展示钱包信息
	const [showTempList, setShowTempList] = useState(false) // 是否展示临时的钱包列表

	useEffect(() => {
		temporarySwitch > 0 && setShowTempList(true)
	}, [temporarySwitch])

	const handleClick = () => {
		if (address) {
			setShowWalletInfo(true)
		} else {
			setShowWalletList(true)
		}
	}

	// 连接钱包
	const connetWallet = (wn: string) => {
		dispatch(batchUpdate({ walletName: wn }))
		setShowWalletList(false)
		setShowTempList(false)
		walletApi[wn]?.getAccount()
	}

	// 断开连接
	const disconnectWallet = () => {
		setShowWalletInfo(false)
		walletApi[walletName]?.disconnect()
	}

	// 已连接的钱包logo
	const connectedWalletLogo = useMemo(() => {
		if (walletName === 'Neoline') {
			return neoline
		} else if (walletName === 'Neon') {
			return neon
		} else if (walletName === 'O3') {
			return o3
		} else {
			return null
		}
	}, [walletName])

	return (
		<div className={`${style.walletWrapper} ${_className}`}>
			<button
				className={`${style.connectBtn} ${address && style.connected} ${
					color === 'white' ? style.whiteBtn : style.blackBtn
				}`}
				onClick={handleClick}
			>
				{address && connectedWalletLogo ? (
					<span className={style.marginRight10}>
						<Image src={connectedWalletLogo} alt='wallet logo' />
					</span>
				) : null}
				<span>
					{address
						? `${address.substring(0, 6)}...${address.substring(address.length - 4, address.length)}`
						: t('connectWallet')}
				</span>
			</button>
			{showWalletList || showWalletInfo || showTempList ? (
				<div
					className={style.maskLayer}
					onClick={() => {
						setShowWalletList(false)
						setShowWalletInfo(false)
						setShowTempList(false)
					}}
				/>
			) : null}
			{showWalletList ? (
				<ul className={style.walletList}>
					<li className={style.walletItem} onClick={() => connetWallet('O3')}>
						<span className={style.walletItemName}>O3</span>
						{o3 ? (
							<span>
								<Image src={o3} alt='wallet logo' width={40} height={40} />
							</span>
						) : null}
					</li>
					<li className={style.walletItem} onClick={() => connetWallet('Neoline')}>
						<span className={style.walletItemName}>Neoline</span>
						{neoline ? (
							<span>
								<Image src={neoline} alt='wallet logo' width={40} height={40} />
							</span>
						) : null}
					</li>
					<li className={style.walletItem} onClick={() => connetWallet('Neon')}>
						<span className={style.walletItemName}>Neon</span>
						{neon ? (
							<span>
								<Image src={neon} alt='wallet logo' width={40} height={40} />
							</span>
						) : null}
					</li>
				</ul>
			) : null}
			{showWalletInfo ? (
				<div className={style.walletInfoWrapper}>
					<div className={style.header}>
						<div className={style.walletNameWrapper}>
							<Image src={connectedWalletLogo} alt='wallet logo' />
							<div className={style.walletName}>{walletName}</div>
						</div>
						<button className={style.disconnectBtn} onClick={disconnectWallet}>
							Disconnect
						</button>
					</div>
					<CopyToClipboard text={address}>
						<div className={style.addressText}>
							<span>{address}</span>
							<span className={style.copyBtn}>
								<Image src={copy} alt='copy' />
							</span>
						</div>
					</CopyToClipboard>
				</div>
			) : null}
			{showTempList ? (
				<ul className={style.walletListTemp}>
					<li className={style.walletItem} onClick={() => connetWallet('O3')}>
						<span className={style.walletItemName}>O3</span>
						{o3 ? (
							<span>
								<Image src={o3} alt='wallet logo' width={40} height={40} />
							</span>
						) : null}
					</li>
					<li className={style.walletItem} onClick={() => connetWallet('Neoline')}>
						<span className={style.walletItemName}>Neoline</span>
						{neoline ? (
							<span>
								<Image src={neoline} alt='wallet logo' width={40} height={40} />
							</span>
						) : null}
					</li>
					<li className={style.walletItem} onClick={() => connetWallet('Neon')}>
						<span className={style.walletItemName}>Neon</span>
						{neon ? (
							<span>
								<Image src={neon} alt='wallet logo' width={40} height={40} />
							</span>
						) : null}
					</li>
				</ul>
			) : null}
		</div>
	)
}

export default Wallet

import { FC, useEffect, useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import i18next from 'i18next'
import { useRouter } from 'next/router'
import BigNumber from 'bignumber.js'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateTemporarySwitch, batchUpdate } from '@/store/features/burger'
import { walletApi } from '@/resources/utils/api/walletApi'
import Modal from '../Modal'
import Popover from '../Popover'
import { integerToDecimal, formatNumber } from '@/resources/utils/convertors'
import { getUnclaimedGAS, claim as claimApi } from '@/resources/utils/api/rpcApi'
import constants from '@/resources/constants'
import getNetworkFee from '@/resources/utils/api/neonjs'
import gasLogo from '@/resources/images/gas-logo.svg'
import gasLogoMini from '@/resources/images/gas-logo-mini.svg'
import learnMore from '@/resources/images/learn-more.svg'
import style_pc from './JazzUp.pc.module.css'
import style_mobile from './JazzUp.mobile.module.css'
import { isMobile } from 'react-device-detect'

interface Props {
	className: string
	setShowDrawer: (show: boolean) => void
}

interface ModalInfo {
	status: string
	hint: string
	jumpUrl?: string
}

const JazzUp: FC<Props> = ({ className: _className, setShowDrawer }) => {
	const { t: _t } = i18next
	const t = useCallback((s: any) => _t(s, { ns: 'jazzUp' }), [_t])
	const router = useRouter()

	const dispatch = useAppDispatch()
	const address = useAppSelector((state) => state.burger.address) // 钱包地址
	const network = useAppSelector((state) => state.burger.network) // 当前网络
	const walletName = useAppSelector((state) => state.burger.walletName) // 连接的钱包名称
	const balance = useAppSelector((state) => state.burger.balance) // 账户资产
	const quoteArr = useAppSelector((state) => state.burger.quoteArr) // NEO、GAS分别对应的usdt价格

	const [unclaimedGAS, setUnclaimedGAS] = useState('') // 可收割的GAS
	const [modalInfo, setModalInfo] = useState<ModalInfo>({ status: 'hide', hint: '' }) // 弹窗信息
	const [totalFee, setTotalFee] = useState('0') // 手续费
	const [isClaiming, setIsClaiming] = useState(false) // 是否在等待claiming返回结果

	const [style, setStyle]: any = useState(style_pc)
	useEffect(() => {
		setStyle(isMobile ? style_mobile : style_pc)
	}, [])

	useEffect(() => {
		if (address) {
			// 获取可claim的gas
			getUnclaimedGAS(address).then((res) => {
				const unclaimedGAS = res?.stack?.[0]?.value ?? '0'
				setUnclaimedGAS(integerToDecimal(unclaimedGAS, 8))
			})
		} else {
			setUnclaimedGAS('')
		}
	}, [address, network])

	useEffect(() => {
		// 模拟claim所需手续费：systemFee + networkFee
		if (address) {
			claimApi(address).then(async (res) => {
				const systemFee = integerToDecimal(res?.gasconsumed, 8)
				let networkFee = await getNetworkFee(constants.BNEO, address, '0', walletName)
				networkFee = integerToDecimal(networkFee, 8)
				setTotalFee(formatNumber(BigNumber.sum(systemFee, networkFee).toString()))
			})
		} else {
			setTotalFee('0')
		}
	}, [address, walletName, unclaimedGAS])

	// claim
	const claim = async () => {
		const network = await walletApi[walletName]?.getNetwork()
		if (network !== 'N3MainNet' && network !== 'MainNet' && router.query.dev === undefined) {
			setModalInfo({
				status: 'error',
				hint: t('networkErr'),
			})
			return
		}
		setModalInfo({
			status: 'pending',
			hint: t('pending'),
		})
		setIsClaiming(true)
		const transferRes = await walletApi[walletName]?.transfer(constants.BNEO, '0')
		if (transferRes?.status === 'success') {
			setModalInfo({
				status: 'success',
				hint: t('success'),
				jumpUrl: `http://explorer.onegate.space/transactionInfo/${transferRes.txid}`,
			})
			setIsClaiming(false)
		} else if (transferRes?.status === 'error') {
			setModalInfo({
				status: 'error',
				hint: t('failed'),
			})
			setIsClaiming(false)
		} else {
			setModalInfo({
				status: 'hide',
				hint: '',
			})
			setIsClaiming(false)
		}
		getUnclaimedGAS(address).then((res) => {
			const unclaimedGAS = res?.stack?.[0]?.value ?? '0'
			setUnclaimedGAS(integerToDecimal(unclaimedGAS, 8))
		})
	}

	// 移动端连接钱包
	// const connectWalletInMobile = useCallback(() => {
	// 	dispatch(batchUpdate({ walletName: 'OneGate' }))
	// 	walletApi['OneGate']?.getAccount()
	// }, [dispatch])

	// claim按钮是否禁用
	const claimBtnDisabled = useMemo(() => {
		if (!address) {
			return false
		}
		if (isClaiming) {
			return true
		}
		if (!unclaimedGAS || unclaimedGAS === '0') {
			return true
		}
		if (!balance[constants.GAS] || balance[constants.GAS] === '0') {
			return true
		}
		return false
	}, [unclaimedGAS, balance, address, isClaiming])

	// 按钮文案
	const btnText = useMemo(() => {
		if (!address) {
			return t('connectWallet')
		}
		if (isClaiming) {
			return t('claiming')
		} else {
			return t('claim')
		}
	}, [address, isClaiming, t])

	// GAS对应的usdt价格
	const exchangeRate = useMemo(() => {
		if (unclaimedGAS && quoteArr?.[1]) {
			return `~ $ ${formatNumber(new BigNumber(unclaimedGAS).times(quoteArr[1]).toString(), { decimals: 2 })}`
		} else {
			return `~ $ -`
		}
	}, [unclaimedGAS, quoteArr])

	return (
		<div className={`${style.wrap} ${_className}`}>
			<div className={style.header}>
				<div className={style.title}>{t('title')}</div>
				<Popover className={style.learnMore} value={t('learnMore')}>
					<Image src={learnMore} alt='learn more' />
				</Popover>
			</div>
			<div className={style.background}>
				<div className={style.hint}>{t('unclaimed')}</div>
				<div className={`${style.spaceBetween} ${style.marginTop16}`}>
					<label className={style.assetWrap}>
						<div className={style.flexShrink0}>
							<Image src={gasLogo} alt='gas logo' />
						</div>
						<span className={style.asset}>GAS</span>
					</label>
					<input
						type='text'
						className={style.inputStyle}
						placeholder='0.0'
						disabled
						value={unclaimedGAS ?? formatNumber(unclaimedGAS)}
					/>
				</div>
				<div className={style.exchangeRate}>{exchangeRate}</div>
				<hr className={style.divider} />
				<ul>
					<li className={style.spaceBetween}>
						<div className={style.spaceBetween}>
							<div className={style.hint}>{t('totalFee')}</div>
							<Popover className={style.marginLeft10} value={t('claimFeeDetail')}>
								<Image src={learnMore} alt='learn more' />
							</Popover>
						</div>
						<label className={style.assetWrap}>
							<span className={`${style.hint} ${style.marginRight10}`}>≈ {totalFee} GAS</span>
							<Image src={gasLogoMini} alt='gas logo mini' />
						</label>
					</li>
				</ul>
			</div>
			<div className={`${style.tip} ${style.marginTop16}`}>{t('tip1')}</div>
			<div className={style.tip}>{t('tip2')}</div>
			<button
				className={`${style.footerBtn} ${claimBtnDisabled && style.disabledBtn} ${style.hideInMobile}`}
				disabled={claimBtnDisabled}
				onClick={() => (address ? claim() : dispatch(updateTemporarySwitch()))}
			>
				{btnText}
			</button>
			<button
				className={`${style.footerBtn} ${claimBtnDisabled && style.disabledBtn} ${style.hideInPC}`}
				disabled={claimBtnDisabled}
				onClick={() => (address ? claim() : setShowDrawer(true))}
			>
				{btnText}
			</button>
			{modalInfo.status !== 'hide' && (
				<Modal
					title={t('claiming')}
					status={modalInfo.status}
					hint={modalInfo.hint}
					jumpUrl={modalInfo.jumpUrl}
					onCancel={() => setModalInfo({ status: 'hide', hint: '' })}
				/>
			)}
		</div>
	)
}

export default JazzUp

import { useState, FC, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import i18next from 'i18next'
import { useRouter } from 'next/router'
import BigNumber from 'bignumber.js'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateTemporarySwitch, batchUpdate } from '@/store/features/burger'
import { walletApi } from '@/resources/utils/api/walletApi'
import Modal from '../Modal'
import Popover from '../Popover'
import { formatNumber } from '@/resources/utils/convertors'
import neoLogo from '@/resources/images/neo-logo.svg'
import bNeoLogo from '@/resources/images/bneo-logo.svg'
import learnMore from '@/resources/images/learn-more.svg'
import exchange from '@/resources/images/exchange.svg'
import gasLogoMini from '@/resources/images/gas-logo-mini.svg'
import constants from '@/resources/constants'
import style_pc from './BurgerStation.pc.module.css'
import style_mobile from './BurgerStation.mobile.module.css'
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

const BurgerStation: FC<Props> = ({ className: _className, setShowDrawer }) => {
	const { t: _t } = i18next
	const t = useCallback((s: any) => _t(s, { ns: 'burgerStation' }), [_t])
	const router = useRouter()

	const dispatch = useAppDispatch()
	const address = useAppSelector((state) => state.burger.address) // 钱包地址
	const network = useAppSelector((state) => state.burger.network) // 当前网络
	const balance = useAppSelector((state) => state.burger.balance) // 账户资产
	const quoteArr = useAppSelector((state) => state.burger.quoteArr) // NEO、GAS分别对应的usdt价格
	const walletName = useAppSelector((state) => state.burger.walletName) // 连接的钱包名称

	const [amount, setAmount] = useState('') // swap数量
	const [transferType, setTransferType] = useState<'mint' | 'redeem'>('mint') // mint: neo->bneo   redeem: bneo->neo
	const [modalInfo, setModalInfo] = useState<ModalInfo>({ status: 'hide', hint: '' }) // 弹窗信息
	const [isSwapping, setIsSwapping] = useState(false) // 是否在等待swap返回结果

	const [style, setStyle]: any = useState(style_pc)
	useEffect(() => {
		setStyle(isMobile ? style_mobile : style_pc)
	}, [])
	useEffect(() => {
		// 重置输入框内容
		setAmount('')
	}, [transferType, address, network])

	// 修改金额
	const changeAmount = (value: string | undefined): void => {
		const res = value?.replace(/[^0-9]/g, '') || ''
		let maxAmount = balance[transferType === 'mint' ? constants.NEO : constants.BNEO]
		if (maxAmount && new BigNumber(res).comparedTo(maxAmount) === 1) {
			setAmount(new BigNumber(maxAmount).integerValue(BigNumber.ROUND_FLOOR).toString())
			return
		}
		setAmount(res)
	}

	// 转换
	const swap = async (transferType: string, amount: string) => {
		const network = await walletApi[walletName]?.getNetwork()
		if (network !== 'N3MainNet' && network !== 'MainNet' && router.query.dev === undefined) {
			setModalInfo({
				status: 'error',
				hint: t('networkErr'),
			})
			return
		}
		let scriptHash = ''
		let assetAmount = ''
		if (transferType === 'mint') {
			scriptHash = constants.NEO
			assetAmount = amount
		} else if (transferType === 'redeem') {
			scriptHash = constants.GAS
			assetAmount = new BigNumber(amount).times(0.001).shiftedBy(8).toString()
		}
		setModalInfo({
			status: 'pending',
			hint: t('pending'),
		})
		setIsSwapping(true)
		const transferRes = await walletApi[walletName]?.transfer(scriptHash, assetAmount)
		if (transferRes?.status === 'success') {
			setModalInfo({
				status: 'success',
				hint: t('success'),
				jumpUrl:
					window.location.search.indexOf('dev') >= 0
						? `http://testnet.explorer.onegate.space/transactionInfo/${transferRes.txid}`
						: `https://explorer.onegate.space/transactionInfo/${transferRes.txid}`,
			})
			setIsSwapping(false)
		} else if (transferRes?.status === 'error') {
			setModalInfo({
				status: 'error',
				hint: t('failed'),
			})
			setIsSwapping(false)
		} else {
			setModalInfo({
				status: 'hide',
				hint: '',
			})
			setIsSwapping(false)
		}
		setAmount('')
		walletApi[walletName]?.getBalance()
	}

	// 移动端连接钱包
	// const connectWalletInMobile = useCallback(() => {
	// 	dispatch(batchUpdate({ walletName: 'OneGate' }))
	// 	walletApi['OneGate']?.getAccount()
	// }, [dispatch])

	// swap按钮是否禁用
	const swapBtnDisabled = useMemo(() => {
		if (!address) {
			return false
		}
		if (isSwapping) {
			return true
		}
		if (new BigNumber(amount).toString() === '0' || amount === '') {
			return true
		} else if (!balance[constants.GAS] || balance[constants.GAS] === '0') {
			return true
		} else {
			return false
		}
	}, [address, amount, balance, isSwapping])

	// 按钮文案
	const btnText = useMemo(() => {
		if (!address) {
			return t('connectWallet')
		}
		if (isSwapping) {
			return t('swapping')
		} else {
			return t('swap')
		}
	}, [address, isSwapping, t])

	// 可用于swap的资产数量
	const availableCount = useMemo((): string => {
		if (!address) {
			return '-'
		} else if (transferType === 'mint') {
			return `Available ${formatNumber(balance[constants.NEO] ?? '0')} NEO`
		} else {
			return `Available ${formatNumber(balance[constants.BNEO] ?? '0')} bNEO`
		}
	}, [address, transferType, balance])

	// NEO/bNEO对应的usdt价格
	const exchangeRate = useMemo(() => {
		if (amount && quoteArr?.[0]) {
			return `~ $ ${formatNumber(new BigNumber(amount).times(quoteArr[0]).toString(), { decimals: 2 })}`
		} else {
			return `~ $ -`
		}
	}, [amount, quoteArr])

	// swap费用
	const swapFee = useMemo(() => {
		if (transferType === 'redeem' && amount && amount !== '0') {
			return new BigNumber(amount).multipliedBy(0.001).toString()
		} else {
			return '0'
		}
	}, [amount, transferType])

	return (
		<div className={`${style.wrap} ${_className}`}>
			<div className={style.header}>
				<div className={style.title}>{t('title')}</div>
				<Popover className={style.learnMore} value={t('learnMore')}>
					<Image src={learnMore} alt='learn more' />
				</Popover>
			</div>
			<div className={style.background}>
				<div className={style.spaceBetween}>
					<div className={style.hint}>{t('from')}</div>
					<div
						className={`${style.tip} ${transferType === 'mint' ? style.green : style.orange}`}
						onClick={() =>
							changeAmount(transferType === 'mint' ? balance[constants.NEO] : balance[constants.BNEO])
						}
					>
						{availableCount}
					</div>
				</div>
				<div className={`${style.spaceBetween} ${style.marginTop16}`}>
					{transferType === 'mint' ? (
						<label className={style.assetWrap}>
							<div className={style.flexShrink0}>
								<Image src={neoLogo} alt='neo logo' />
							</div>
							<span className={style.asset}>NEO</span>
						</label>
					) : (
						<label className={style.assetWrap}>
							<div className={style.flexShrink0}>
								<Image src={bNeoLogo} alt='bNEO logo' />
							</div>
							<span className={style.asset}>bNEO</span>
						</label>
					)}
					<input
						type='text'
						className={style.inputStyle}
						placeholder='0'
						disabled={!address}
						value={amount}
						onChange={(e) => changeAmount(e.target.value)}
					/>
				</div>
				<div className={style.exchangeRate}>{exchangeRate}</div>
			</div>
			<div className={style.exchangeWrap}>
				<Image
					src={exchange}
					alt='exchange'
					className={style.imageBtn}
					onClick={() => setTransferType(transferType === 'mint' ? 'redeem' : 'mint')}
				/>
			</div>
			<div className={`${style.background} ${style.marginBottom24}`}>
				<div className={style.spaceBetween}>
					<div className={style.hint}>{t('to')}</div>
				</div>
				<div className={`${style.spaceBetween} ${style.marginTop16}`}>
					{transferType === 'mint' ? (
						<label className={style.assetWrap}>
							<div className={style.flexShrink0}>
								<Image src={bNeoLogo} alt='bNEO logo' />
							</div>
							<span className={style.asset}>bNEO</span>
						</label>
					) : (
						<label className={style.assetWrap}>
							<div className={style.flexShrink0}>
								<Image src={neoLogo} alt='neo logo' />
							</div>
							<span className={style.asset}>NEO</span>
						</label>
					)}
					<input
						type='text'
						className={style.inputStyle}
						placeholder='0'
						disabled={!address}
						value={amount}
						onChange={(e) => changeAmount(e.target.value)}
					/>
				</div>
			</div>
			{transferType === 'redeem' ? (
				<ul className={`${style.background} ${style.marginBottom24}`}>
					<li className={style.spaceBetween}>
						<div className={style.spaceBetween}>
							<label className={style.hint}>{t('swapFee')}</label>
						</div>
						<div className={style.assetWrap}>
							<span className={`${style.hint} ${style.marginRight10}`}>{swapFee} GAS</span>
							<Image src={gasLogoMini} alt='gas logo mini' />
						</div>
					</li>
				</ul>
			) : null}
			<div className={style.btnTip}>{t('tip')}</div>
			<button
				className={`${style.footerBtn} ${swapBtnDisabled && style.disabledBtn} ${style.hideInMobile}`}
				disabled={swapBtnDisabled}
				onClick={() => (address ? swap(transferType, amount) : dispatch(updateTemporarySwitch()))}
			>
				{btnText}
			</button>
			<button
				className={`${style.footerBtn} ${swapBtnDisabled && style.disabledBtn} ${style.hideInPC}`}
				disabled={swapBtnDisabled}
				onClick={() => (address ? swap(transferType, amount) : setShowDrawer(true))}
			>
				{btnText}
			</button>
			{modalInfo.status !== 'hide' && (
				<Modal
					title={t('swapping')}
					status={modalInfo.status}
					hint={modalInfo.hint}
					jumpUrl={modalInfo.jumpUrl}
					onCancel={() => setModalInfo({ status: 'hide', hint: '' })}
				/>
			)}
		</div>
	)
}

export default BurgerStation

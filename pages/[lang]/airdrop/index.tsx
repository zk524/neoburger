import type { NextPage } from 'next'
import i18next from 'i18next'
import { getAllLanguageSlugs, getLanguage } from '@/resources/i18n/config'
import { useRouter } from 'next/router'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { wallet } from '@cityofzion/neon-js'
import { walletApi } from '@/resources/utils/api/walletApi'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateTemporarySwitch } from '@/store/features/burger'
import memberList from './airdropMemberList3.json'
import ColorTab from '@/components/ColorTab'
import Modal from '@/components/Modal'
import Alert from '@/components/Alert'
import { getTotalNoBug, nobugIsClaimed } from '@/resources/utils/api/rpcApi'
import { formatNumber, integerToDecimal } from '@/resources/utils/convertors'
import style from './Airdrop.module.css'
import nbLogo from '@/resources/images/nbLogo.svg'
import rightGreen from '@/resources/images/right-green.svg'
import nbLogo2 from '@/resources/images/nbLogo2.svg'
import Image from 'next/image'

interface ModalInfo {
	status: string
	hint: string
	jumpUrl?: string
}

interface ClaimParams {
	scripthash: string
	amount: string
	nonce: string
	proof: string[]
	isClaimed?: boolean
	isClaiming?: boolean
}

const AirDrop: NextPage = () => {
	const { t: _t } = i18next
	const t = useCallback((s: any) => _t(s, { ns: 'airdrop' }), [_t])
	const router = useRouter()

	const [currentTab, setCurrentTab] = useState(0)
	const [totalSupply, setTotalSupply] = useState('-')
	const [claimParamList, setClaimParamsList] = useState<ClaimParams[]>([]) // 合约claim方法需要的参数
	const [modalInfo, setModalInfo] = useState<ModalInfo>({ status: 'hide', hint: '' }) // 弹窗信息

	const dispatch = useAppDispatch()
	const address = useAppSelector((state) => state.burger.address) // 钱包地址
	const walletName = useAppSelector((state) => state.burger.walletName) // 连接的钱包名称
	const network = useAppSelector((state) => state.burger.network) // 当前网络

	useEffect(() => {
		getTotalSupply()
	}, [])

	useEffect(() => {
		const obj = {}
		memberList.forEach((v) => (obj?.[v.scripthash] ? obj[v.scripthash].push(v) : (obj[v.scripthash] = [v])))
		const claimParams: ClaimParams[] = obj?.[`0x${wallet.getScriptHashFromAddress(address)}`]
		if (claimParams && claimParams.length > 0) {
			updateClaimStatus(claimParams)
		} else {
			updateClaimStatus()
		}
	}, [address])

	// 按钮文案
	const btnText = useCallback(
		(text?: string) => {
			if (text) {
				return t(text)
			} else {
				return t('claim')
			}
		},
		[t]
	)

	// 领取nobug
	const claim = async (index: number) => {
		const network = await walletApi[walletName]?.getNetwork()
		if (network !== 'N3MainNet' && network !== 'MainNet' && router.query.dev === undefined) {
			setModalInfo({
				status: 'error',
				hint: t('networkErr'),
			})
			return
		}
		if (claimParamList[index]) {
			setModalInfo({
				status: 'pending',
				hint: t('pending'),
			})
			claimParamList[index].isClaiming = true
			setClaimParamsList([...claimParamList])
			const transferRes = await walletApi[walletName]?.claimNoBug(
				claimParamList[index].scripthash,
				claimParamList[index].amount,
				claimParamList[index].nonce,
				claimParamList[index].proof
			)
			if (transferRes?.status === 'success') {
				setModalInfo({
					status: 'success',
					hint: t('success'),
					jumpUrl:
						window.location.search.indexOf('dev') >= 0
							? `http://testnet.explorer.onegate.space/transactionInfo/${transferRes.txid}`
							: `https://explorer.onegate.space/transactionInfo/${transferRes.txid}`,
				})
				claimParamList[index].isClaiming = false
				setClaimParamsList([...claimParamList])
			} else if (transferRes?.status === 'error') {
				setModalInfo({
					status: 'error',
					hint: t('failed'),
				})
				claimParamList[index].isClaiming = false
				setClaimParamsList([...claimParamList])
			} else {
				setModalInfo({
					status: 'hide',
					hint: '',
				})
				claimParamList[index].isClaiming = false
				setClaimParamsList([...claimParamList])
			}
			updateClaimStatus(claimParamList)
			getTotalSupply()
		}
	}

	// 获取totalSupply
	const getTotalSupply = () => {
		getTotalNoBug().then((res) => {
			const count = res?.stack?.[0]?.value ?? null
			setTotalSupply(count ? formatNumber(integerToDecimal(count, 10)) : '-')
		})
	}

	// 更新领取状态
	const updateClaimStatus = (claimParams?: ClaimParams[]) => {
		if (claimParams) {
			Promise.all(claimParams.map((v) => nobugIsClaimed(v.scripthash, v.amount, v.nonce, v.proof))).then(
				(res) => {
					const arr = [...claimParams]
					res.forEach((v, i) => {
						if (v?.state && v.state === 'FAULT') {
							arr[i].isClaimed = true
							arr[i].isClaiming = false
						}
					})
					setClaimParamsList(arr)
				}
			)
		} else {
			setClaimParamsList([])
		}
	}

	return (
		<div className={style.airdropContainer}>
			<h1 className={style.airdropTitle}>{t('title')}</h1>
			{address && (
				<section className={style.claimWrapper}>
					<div className={style.receiveTextWrapper}>
						<div className={style.receiveText}>{t('receive')}</div>
						<Image src={nbLogo} alt='nbLogo' />
					</div>
					{claimParamList.length > 1 ? (
						<div className={style.claimScroll}>
							{claimParamList.map((v, i) => (
								<div className={style.amountWrapper} key={i}>
									{v?.isClaimed ? (
										<button className={`${style.claimBtn} ${style.disabledBtn}`} disabled={true}>
											<Image className={style.claimedIcon} src={rightGreen} alt='rightGreen' />
											<span>{t('claimed')}</span>
										</button>
									) : (
										<button
											className={`${style.claimBtn} ${(v.isClaiming || !v) && style.disabledBtn}`}
											disabled={v.isClaiming || !v}
											onClick={() => claim(i)}
										>
											<span>{btnText(v.isClaiming ? 'claiming' : undefined)}</span>
										</button>
									)}
									<div className={style.amountText}>
										{v ? formatNumber(integerToDecimal(v.amount, 10)) : '-'}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className={style.zero}>
							{claimParamList[0]?.amount
								? formatNumber(integerToDecimal(claimParamList[0]?.amount, 10))
								: '-'}
						</div>
					)}
					{claimParamList.length <= 1 ? (
						<button
							className={`${style.claimBtn2} ${
								claimParamList[0]?.amount && !claimParamList[0]?.isClaimed ? '' : style.disabledBtn
							}`}
							disabled={!claimParamList[0]?.amount || claimParamList[0]?.isClaimed}
							onClick={() => claim(0)}
						>
							{btnText(
								claimParamList[0]?.isClaimed
									? 'claimed'
									: claimParamList[0]?.isClaiming
									? 'claiming'
									: undefined
							)}
						</button>
					) : null}
				</section>
			)}
			{!address && (
				<section className={style.unconnectWrapper}>
					<div className={style.unconnectTip}>{t('unconnect')}</div>
					<button className={style.connectBtn} onClick={() => dispatch(updateTemporarySwitch())}>
						{t('connectWallet')}
					</button>
				</section>
			)}
			<article>
				<h2 className={style.articleTitle}>{t('what')}</h2>
				<p className={style.articleParagraph}>{t('whatExplain1')}</p>
				<p className={`${style.articleParagraph} ${style.marginTop24}`}>{t('whatExplain2')}</p>
				<div className={style.card}>
					<div className={style.cardHeader}>
						<div className={style.cardTitle}>{t('cardTitle')}</div>
						<Image src={nbLogo2} alt='nbLogo2' />
						<div className={style.cardDecimals}>{t('decimals')}</div>
					</div>
					<hr className={style.divider} />
					<div className={style.totalText}>{t('total')}</div>
					<div className={style.totalAmount}>{totalSupply}</div>
					<hr className={style.divider} />
					<div className={style.totalText}>{t('cardDetailTitle')}</div>
					<div className={style.cardPercentageWrapper}>
						<span className={style.cardPercentage}>25%</span>
						<span className={style.cardDistribution}>{t('distribution1')}</span>
					</div>
					<div className={style.cardPercentageWrapper}>
						<span className={style.cardPercentage}>75%</span>
						<span className={style.cardDistribution}>{t('distribution2')}</span>
					</div>
					<hr className={`${style.divider2} ${style.marginTop35}`} />
					<hr className={style.divider2} />
				</div>
			</article>
			<article>
				<h2 className={style.articleTitle}>{t('usage')}</h2>
				<ul className={style.usageTabWrapper}>
					<ColorTab value={t('usageTab1')} isSelected={currentTab === 0} onClick={() => setCurrentTab(0)} />
					<ColorTab
						value={t('usageTab2')}
						isSelected={currentTab === 1}
						className={style.usageTab}
						onClick={() => setCurrentTab(1)}
					/>
					<ColorTab value={t('usageTab3')} isSelected={currentTab === 2} onClick={() => setCurrentTab(2)} />
				</ul>
				{currentTab === 0 ? (
					<div className={style.articleParagraphWrapper}>
						<p className={style.articleParagraph}>{t('raiseExplain1')}</p>
						<p className={`${style.articleParagraph} ${style.marginTop24}`}>{t('raiseExplain2')}</p>
					</div>
				) : null}
				{currentTab === 1 ? (
					<div className={style.articleParagraphWrapper}>
						<p className={style.articleParagraph}>{t('voteExplain')}</p>
					</div>
				) : null}
				{currentTab === 2 ? (
					<div className={style.articleParagraphWrapper}>
						<p className={style.articleParagraph}>{t('delegateExplain')}</p>
					</div>
				) : null}
			</article>
			<article>
				<h2 className={style.articleTitle}>{t('distribution')}</h2>
				<section>
					<h3 className={style.percentage}>25%</h3>
					<h4 className={style.subTitle}>{t('plan1')}</h4>
					<h5 className={style.subsubTitle}>{t('detailExplainTitle1')}</h5>
					<p className={`${style.articleParagraph} ${style.marginTop16}`}>{t('detailExplain1')}</p>
					<h5 className={`${style.subsubTitle} ${style.marginTop24}`}>{t('detailExplainTitle2')}</h5>
					<p className={`${style.articleParagraph} ${style.marginTop16}`}>{t('detailExplain2')}</p>
					<p className={style.articleParagraph}>{t('detailExplain3')}</p>
				</section>
				<section>
					<h3 className={style.percentage}>75%</h3>
					<h4 className={style.subTitle}>{t('plan2')}</h4>
					<ul>
						<li className={style.articleParagraph}>{t('detailExplain4')}</li>
						<li className={style.articleParagraph}>{t('detailExplain5')}</li>
					</ul>
					<h5 className={`${style.subsubTitle} ${style.marginTop24}`}>{t('ways')}</h5>
					<p className={`${style.articleParagraph} ${style.marginTop16}`}>{t('waysTitle1')}</p>
					<ul>
						<li className={style.articleParagraph}>{t('wayExplain1')}</li>
						<li className={style.articleParagraph}>{t('wayExplain2')}</li>
					</ul>
					<p className={`${style.articleParagraph} ${style.marginTop16}`}>{t('waysTitle2')}</p>
					<ul>
						<li className={style.articleParagraph}>{t('wayExplain3')}</li>
						<li className={style.articleParagraph}>{t('wayExplain4')}</li>
						<li className={style.articleParagraph}>{t('wayExplain5')}</li>
					</ul>
				</section>
			</article>
			{modalInfo.status !== 'hide' && (
				<Modal
					title={t('claiming')}
					status={modalInfo.status}
					hint={modalInfo.hint}
					jumpUrl={modalInfo.jumpUrl}
					onCancel={() => setModalInfo({ status: 'hide', hint: '' })}
				/>
			)}
			{address && network !== 'N3MainNet' && network !== 'MainNet' ? <Alert value={t('networkErr')} /> : null}
		</div>
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
	const language = getLanguage(params.lang)
	return {
		props: {
			language,
		},
	}
}

export default AirDrop

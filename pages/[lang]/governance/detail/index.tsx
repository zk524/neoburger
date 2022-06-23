import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import i18next from 'i18next'
import { getAllLanguageSlugs, getLanguage } from '@/resources/i18n/config'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { u } from '@cityofzion/neon-js'
import style from './Detail.module.css'
import Modal from '@/components/Modal'
import { walletApi } from '@/resources/utils/api/walletApi'
import { formatNumber, integerToDecimal } from '@/resources/utils/convertors'
import { useAppSelector } from '@/store/hooks'
import { getProposalDetail, getVoteStatus, getTotalNoBug } from '@/resources/utils/api/rpcApi'
import proposalBg from '@/resources/images/proposal-bg.svg'
import right from '@/resources/images/right.svg'
import error from '@/resources/images/error-red.svg'
import rightBlack from '@/resources/images/right-black.svg'
import Image from 'next/image'

dayjs.extend(isSameOrAfter)

interface ProposalDetail {
	id: string
	title?: string
	desc?: string
	startDate?: string
	endDate?: string
	expand: boolean
	status?: string
	for: BigNumber
	against: BigNumber
	voteStatus?: string
	scripthash?: string
	method?: string
	args?: any[]
}

interface ModalInfo {
	status: string
	hint: string
	jumpUrl?: string
}

const ProposalDetail: NextPage = () => {
	const { t: _t } = i18next
	const t = (s: any) => _t(s, { ns: 'governance' })
	const router = useRouter()

	const address = useAppSelector((state) => state.burger.address) // 钱包地址
	const walletName = useAppSelector((state) => state.burger.walletName) // 连接的钱包名称

	const [nobugTotalSupply, setNobugTotalSupply] = useState('-')
	const [proposalDetail, setProposalDetail] = useState<ProposalDetail>()
	const [modalInfo, setModalInfo] = useState<ModalInfo>({ status: 'hide', hint: '' }) // 弹窗信息

	useEffect(() => {
		getTotalSupply()
	}, [])

	useEffect(() => {
		if (router.query.id && address) {
			getDetail()
		}
	}, [router, t, address]) //eslint-disable-line react-hooks/exhaustive-deps

	// 获取nobug的totalSupply
	const getTotalSupply = () => {
		getTotalNoBug().then((res) => {
			const count = res?.stack?.[0]?.value ?? null
			setNobugTotalSupply(count ? formatNumber(integerToDecimal(count, 10)) : '-')
		})
	}

	const getDetail = () => {
		getProposalDetail(router.query.id as string).then(async (result) => {
			if (result && result.state === 'HALT') {
				const detail: ProposalDetail = {
					expand: false,
					id: router.query.id as string,
					for: new BigNumber(0),
					against: new BigNumber(0),
				}
				detail.title = result?.stack?.[0]?.value?.[1] && u.base642utf8(result.stack[0].value[1].value)
				detail.desc = result?.stack?.[0]?.value?.[2] && u.base642utf8(result.stack[0].value[2].value)
				detail.startDate =
					result?.stack?.[0]?.value?.[7] &&
					dayjs(parseInt(result.stack[0].value[7].value)).format('YYYY-MM-DD hh:mm')
				detail.endDate =
					result?.stack?.[0]?.value?.[8] &&
					dayjs(parseInt(result.stack[0].value[8].value)).format('YYYY-MM-DD hh:mm')
				detail.scripthash =
					result?.stack?.[0]?.value?.[3] && `0x${u.reverseHex(u.base642hex(result.stack[0].value[3].value))}`
				detail.method = result?.stack?.[0]?.value?.[4] && u.base642utf8(result.stack[0].value[4].value)
				detail.args = result?.stack?.[0]?.value?.[5]?.value
				detail.for = new BigNumber('23456')
				detail.against = new BigNumber('12345')
				const voteStatus = await getVoteStatus(address, `${detail.id}`)
				detail.voteStatus = voteStatus?.stack?.[0]?.value
				if (dayjs().isSameOrAfter(dayjs(detail.endDate))) {
					if (result?.stack?.[0]?.value?.[9] && result.stack[0].value[9].value === 0) {
						detail.status = 'Failed'
					} else {
						detail.status = 'Executed'
					}
				} else {
					detail.status = 'Active'
				}
				setProposalDetail(detail)
			}
		})
	}

	// 投票
	const vote = async (params: ProposalDetail | undefined, forOrAgainst: boolean) => {
		if (!params) {
			return
		}
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
		let unvote = false
		if ((forOrAgainst && params.voteStatus === '1') || (!forOrAgainst && params.voteStatus === '-1')) {
			unvote = true
		}
		const res = await walletApi[walletName]?.vote(address, `${params.id}`, forOrAgainst, unvote)
		if (res.status === 'success') {
			getDetail()
			setModalInfo({
				status: 'success',
				hint: t('success'),
				jumpUrl: `http://explorer.onegate.space/transactionInfo/${res.txid}`,
			})
		} else if (res.status === 'error') {
			setModalInfo({
				status: 'error',
				hint: t('failed'),
			})
		} else {
			setModalInfo({
				status: 'hide',
				hint: '',
			})
		}
	}

	return (
		<div className={style.wrapper}>
			<div className={style.proposalWrapper}>
				<Image className={style.proposalBgIcon} src={proposalBg} alt='proposalBg' />
				<div className={style.title}>{t('proposal')}</div>
				<div className={style.breadCrumbs}>
					<a className={style.jumpText} onClick={() => router.back()}>
						{t('allProposals')}
					</a>
					<span> / </span>
					<span className={style.deepen}>{t('proposalDetails')}</span>
				</div>
				<div className={style.proposalTitle}>{proposalDetail?.title}</div>
				<div className={style.bottomWrapper}>
					<div className={style.leftWrapper}>
						<div className={style.leftItemWrapper}>
							<div className={style.itemLine}>
								<div>{t('status')}</div>
								<div
									className={
										proposalDetail?.status === 'Active'
											? style.active
											: proposalDetail?.status === 'Failed'
											? style.failed
											: style.executed
									}
								>
									{proposalDetail?.status}
								</div>
							</div>
							<div className={style.itemLine}>
								<div>{t('proposal')}</div>
								<div>BIP #{proposalDetail?.id}</div>
							</div>
							<div className={style.itemLine}>
								<div>{t('desc')}</div>
								<div>{proposalDetail?.desc}</div>
							</div>
						</div>
						<div className={style.leftItemWrapper}>
							<div className={style.itemLine2}>Execution Object</div>
							<div className={style.itemLine}>
								<div>ScriptHash</div>
								<div className={style.exeValue}>{proposalDetail?.scripthash}</div>
							</div>
							<div className={style.itemLine}>
								<div>Method</div>
								<div className={style.exeValue}>{proposalDetail?.method}</div>
							</div>
							<div className={style.itemLine}>
								<div>Args</div>
								{proposalDetail?.args ? (
									<div className={style.exeValue2}>
										{proposalDetail?.args ? JSON.stringify(proposalDetail.args) : ''}
									</div>
								) : null}
							</div>
						</div>
					</div>
					<div className={style.rightWrapper}>
						<div className={style.rightItemWrapper}>
							<div className={style.itemLineRight}>
								<div>{t('totalVotes')}</div>
								<div>{nobugTotalSupply}</div>
							</div>
							<div className={style.itemLineRight}>
								<div>{t('voteStatus')}</div>
								<div
									className={
										proposalDetail?.voteStatus === '1'
											? style.for
											: proposalDetail?.voteStatus === '-1'
											? style.against
											: style.unvoted
									}
								>
									{proposalDetail?.voteStatus === '1'
										? t('for')
										: proposalDetail?.voteStatus === '-1'
										? t('against')
										: t('unvoted')}
								</div>
							</div>
							<div className={style.proposalItemWrapper}>
								<div className={style.vsWrapper}>
									<div className={style.flex}>
										<div>{t('for')}</div>
										<div>{formatNumber(proposalDetail?.for.toString())}</div>
									</div>
									<div className={style.proposalItemVoteVsGray}>
										<div
											className={style.proposalItemVoteForYellow}
											style={{
												width: `${proposalDetail?.for
													.dividedBy(proposalDetail?.for.plus(proposalDetail?.against))
													.times(100)
													.toString()}%`,
											}}
										/>
									</div>
								</div>
								<button
									className={`${style.forBtn} ${
										proposalDetail?.status !== 'Active' ? style.disabled : ''
									}`}
									disabled={proposalDetail?.status !== 'Active'}
									onClick={() => vote(proposalDetail, true)}
								>
									{proposalDetail?.voteStatus === '1' && (
										<Image className={style.marginRight5} src={rightBlack} alt='rightBlack' />
									)}
									<span>{t('for')}</span>
								</button>
							</div>
							<div className={style.proposalItemWrapper}>
								<div className={style.vsWrapper}>
									<div className={style.flex}>
										<div>{t('against')}</div>
										<div>{formatNumber(proposalDetail?.against.toString())}</div>
									</div>
									<div className={style.proposalItemVoteVsGray}>
										<div
											className={style.proposalItemVoteForPurple}
											style={{
												width: `${proposalDetail?.against
													.dividedBy(proposalDetail?.for.plus(proposalDetail?.against))
													.times(100)
													.toString()}%`,
											}}
										/>
									</div>
								</div>
								<button
									className={`${style.againstBtn} ${
										proposalDetail?.status !== 'Active' ? style.disabled : ''
									}`}
									disabled={proposalDetail?.status !== 'Active'}
									onClick={() => vote(proposalDetail, false)}
								>
									{proposalDetail?.voteStatus === '-1' && (
										<Image className={style.marginRight5} src={rightBlack} alt='rightBlack' />
									)}
									<span>{t('against')}</span>
								</button>
							</div>
						</div>
						<div className={style.rightBottomItemWrapper}>
							<div className={style.historyTitle}>History</div>
							{proposalDetail?.status && (
								<div>
									<div className={style.flexRow}>
										<div>
											<div
												className={`${style.circle} ${
													proposalDetail?.status === 'Active' ? style.during : style.passed
												}`}
											>
												{proposalDetail?.status === 'Active' ? (
													'1'
												) : (
													<Image src={right} alt='right' />
												)}
											</div>
											<div
												className={`${style.connectLine} ${
													proposalDetail?.status !== 'Active' ? style.passedLine : ''
												}`}
											/>
										</div>
										<div className={style.timeLineTextWrapper}>
											<div
												className={
													proposalDetail?.status === 'Active' ? style.black : style.for
												}
											>
												{t('active')}
											</div>
											<div
												className={
													proposalDetail?.status === 'Active' ? style.black : style.for
												}
											>
												{proposalDetail?.startDate}
											</div>
										</div>
									</div>
									<div className={style.flexRow}>
										<div>
											<div
												className={`${style.circle} ${
													proposalDetail?.status === 'Executed' ? style.passed : ''
												} ${proposalDetail?.status === 'Failed' ? style.failedCircle : ''}`}
											>
												{proposalDetail?.status === 'Active' ? (
													'2'
												) : proposalDetail?.status === 'Failed' ? (
													<Image src={error} alt='error' />
												) : (
													<Image src={right} alt='right' />
												)}
											</div>
											<div
												className={`${style.connectLineShort} ${
													proposalDetail?.status === 'Executed' ? style.passedLine : ''
												} ${proposalDetail?.status === 'Failed' ? style.failedLine : ''}`}
											/>
										</div>
										<div className={style.timeLineTextWrapper}>
											<div
												className={
													proposalDetail?.status === 'Active'
														? style.black
														: proposalDetail?.status === 'Executed'
														? style.for
														: style.failed
												}
											>
												{proposalDetail?.status === 'Failed' ? 'Failed' : 'Executed'}
											</div>
											<div
												className={
													proposalDetail?.status === 'Active'
														? style.black
														: proposalDetail?.status === 'Executed'
														? style.for
														: style.failed
												}
											>
												{proposalDetail?.endDate}
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			{modalInfo.status !== 'hide' && (
				<Modal
					title={t('vote')}
					status={modalInfo.status}
					hint={modalInfo.hint}
					jumpUrl={modalInfo.jumpUrl}
					onCancel={() => setModalInfo({ status: 'hide', hint: '' })}
				/>
			)}
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

export default ProposalDetail

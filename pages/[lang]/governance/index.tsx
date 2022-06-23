import type { NextPage } from 'next'
import i18next from 'i18next'
import { getAllLanguageSlugs, getLanguage } from '@/resources/i18n/config'
import { useEffect, useState, useRef, MouseEvent } from 'react'
import { useRouter } from 'next/router'
import { u } from '@cityofzion/neon-js'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import BigNumber from 'bignumber.js'
import { formatNumber, integerToDecimal } from '@/resources/utils/convertors'
import { walletApi } from '@/resources/utils/api/walletApi'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateTemporarySwitch } from '@/store/features/burger'
import { getLatestProposalID, getProposalDetail, getVoteStatus, getTotalNoBug } from '@/resources/utils/api/rpcApi'
import Modal from '@/components/Modal'
import style from './Governance.module.css'
import flag from '@/resources/images/flag.svg'
import twitter from '@/resources/images/twitter.svg'
import expand from '@/resources/images/expand.svg'
import collapse from '@/resources/images/collapse.svg'
import closeBtn from '@/resources/images/close-btn-shadow.svg'
import addCircle from '@/resources/images/add-circle.svg'
import minusCircle from '@/resources/images/minus-circle.svg'
import rightBlack from '@/resources/images/right-black.svg'
import constants from '@/resources/constants'
import Image from 'next/image'

dayjs.extend(isSameOrAfter)
interface ProposalDetail {
	id: number
	title?: string
	desc?: string
	startDate?: string
	endDate?: string
	expand: boolean
	status?: string
	for: BigNumber
	against: BigNumber
	voteStatus?: string
}

interface ProposalParams {
	title: string
	description: string
	scripthash: string
	method: string
	args: any[]
}

interface ModalInfo {
	status: string
	hint: string
	jumpUrl?: string
}

const Governance: NextPage = () => {
	const { t: _t } = i18next
	const t = (s: any) => _t(s, { ns: 'governance' })
	const router = useRouter()

	const maskLayer = useRef<HTMLDivElement>(null)
	const proposalList = useRef<HTMLDivElement>(null)
	const proposalShowCount = useRef(0)

	const dispatch = useAppDispatch()
	const network = useAppSelector((state) => state.burger.network) // 当前网络
	const balance = useAppSelector((state) => state.burger.balance) // 账户资产
	const address = useAppSelector((state) => state.burger.address) // 钱包地址
	const walletName = useAppSelector((state) => state.burger.walletName) // 连接的钱包名称

	const [showProposalModal, setShowProposalModal] = useState(false)
	const [proposalCount, setProposalCount] = useState(0)
	const [nobugTotalSupply, setNobugTotalSupply] = useState('-')
	const [modalInfo, setModalInfo] = useState<ModalInfo>({ status: 'hide', hint: '' }) // 弹窗信息
	const [proposalDetailList, setProposalDetailList] = useState<ProposalDetail[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [newProposalParams, setNewProposalParams] = useState<ProposalParams>({
		title: '',
		description: '',
		scripthash: '',
		method: '',
		args: [{ type: '', value: '' }],
	})

	console.log(balance)

	useEffect(() => {
		getTotalSupply()
		if (address) {
			init()
		}
	}, [address]) //eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (address) {
			// 获取钱包资产
			walletApi[walletName]?.getBalance()
		}
	}, [address, network, walletName])

	useEffect(() => {
		let proposalListRef: HTMLDivElement | null = null
		if (proposalList.current) {
			const cb = () => {
				if (proposalList.current) {
					const threshold =
						proposalList.current.scrollHeight -
						proposalList.current.scrollTop -
						proposalList.current.clientHeight
					if (threshold <= 50 && proposalCount !== proposalShowCount.current && !isLoading) {
						getMoreProposal()
					}
				}
			}
			proposalList.current.addEventListener('scroll', cb)
			proposalListRef = proposalList.current
			return () => {
				if (proposalListRef) {
					proposalListRef?.removeEventListener('scroll', cb)
				}
			}
		}
	}, [isLoading, proposalShowCount, proposalCount]) //eslint-disable-line react-hooks/exhaustive-deps

	// 初始化
	const init = () => {
		proposalShowCount.current = 0
		getLatestProposalID().then((res) => {
			if (res?.stack?.[0]) {
				const count = parseInt(res.stack[0].value)
				setProposalCount(count)
				getMoreProposal(count)
			}
		})
	}

	// 获取nobug的totalSupply
	const getTotalSupply = () => {
		getTotalNoBug().then((res) => {
			const count = res?.stack?.[0]?.value ?? null
			setNobugTotalSupply(count ? formatNumber(integerToDecimal(count, 10)) : '-')
		})
	}

	// 关闭弹窗
	const closeProposalModal = (e: MouseEvent) => {
		if (e.target !== maskLayer.current) {
			return
		}
		setShowProposalModal(false)
	}

	// 展开收缩
	const updateExpand = (index: number) => {
		proposalDetailList[index].expand = !proposalDetailList[index].expand
		setProposalDetailList([...proposalDetailList])
	}

	// 获取更多提案
	const getMoreProposal = (count?: number) => {
		const totalCount = count || proposalCount
		setIsLoading(true)
		let i = 0
		const promiseArr = []
		while (i < 3 && proposalShowCount.current < totalCount) {
			promiseArr.push(getProposalDetail(`${totalCount - proposalShowCount.current}`))
			proposalShowCount.current++
			i++
		}
		Promise.all(promiseArr).then((res) => {
			const detailList = res.map(async (result, index): Promise<ProposalDetail | null> => {
				if (result.state === 'HALT') {
					const detail: ProposalDetail = {
						expand: false,
						id: totalCount - (proposalShowCount.current - i) - index,
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
					return await detail
				} else {
					return await null
				}
			})
			Promise.all(detailList).then((res: (ProposalDetail | null)[]) => {
				const newList = res.filter((v) => v !== null) as ProposalDetail[]
				setProposalDetailList([...proposalDetailList, ...newList])
				setIsLoading(false)
			})
		})
	}

	// 更新新提案参数
	const updateParams = (value: string | undefined, type: string, index?: number) => {
		if (value === undefined) {
			if (type === 'add') {
				setNewProposalParams({
					...newProposalParams,
					args: [...newProposalParams.args, { type: '', value: '' }],
				})
			} else {
				newProposalParams.args.splice(index as number, 1)
				setNewProposalParams({ ...newProposalParams, args: newProposalParams.args })
			}
		} else if (index === undefined) {
			setNewProposalParams({ ...newProposalParams, [type]: value })
		} else {
			newProposalParams.args[index][type] = value
			setNewProposalParams({ ...newProposalParams, args: [...newProposalParams.args] })
		}
	}

	// 提交新提案
	const submit = async () => {
		if (
			!newProposalParams.title ||
			!newProposalParams.description ||
			!newProposalParams.scripthash ||
			!newProposalParams.method
		) {
			return
		} else {
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
			const args = newProposalParams.args
				.filter((v) => v.type && v.value)
				.map((v) => {
					if (v.type === 'Array') {
						return {
							type: 'Array',
							value: eval(v.value),
						}
					}
					return v
				})
			const res = await walletApi[walletName]?.newProposal(
				address,
				`${proposalCount + 1}`,
				newProposalParams.title,
				newProposalParams.description,
				newProposalParams.scripthash,
				newProposalParams.method,
				args
			)
			if (res.status === 'success') {
				init()
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
	}

	// 投票
	const vote = async (params: ProposalDetail, forOrAgainst: boolean, index: number) => {
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
			proposalDetailList[index].voteStatus = unvote ? '0' : forOrAgainst ? '1' : '-1'
			setProposalDetailList([...proposalDetailList])
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
			<div className={style.introWrapper}>
				<article className={style.articleWrapper}>
					<p className={style.marginBottom16}>{t('intro1')}</p>
					<p className={style.marginBottom16}>{t('intro2')}</p>
					<p>{t('intro3')}</p>
					<ul className={style.introUl}>
						<li>{t('intro4')}</li>
						<li>{t('intro5')}</li>
						<li>{t('intro6')}</li>
						<li>{t('intro7')}</li>
					</ul>
					<button className={style.twitterBtn}>
						<Image className={style.btnIcon} src={twitter} alt='twitter' />
						<a
							className={style.btnText}
							href='https://twitter.com/NeoBurger_io'
							target='_blank'
							rel='noreferrer'
						>
							Twitter
						</a>
					</button>
				</article>
				<Image className={style.flag} src={flag} alt='flag' />
			</div>
			<div className={style.voteWrapper}>
				<div className={style.marginRight48}>
					{t('totalVotes')} : {nobugTotalSupply}
				</div>
				<div>
					{t('yourVotes')} : {balance[constants.NOBUG] ? formatNumber(balance[constants.NOBUG]) : '-'}
				</div>
			</div>
			<div className={style.proposalWrapper}>
				<div className={style.proposalHeader}>
					<div className={style.proposalTitle}>{t('proposals')}</div>
					<div
						className={style.proposalHeaderBtn}
						onClick={() => (address ? setShowProposalModal(true) : dispatch(updateTemporarySwitch()))}
					>
						<span className={style.proposalHeaderBtnText}>{t('newProposal')}</span>
						<span className={style.proposalHeaderBtnIcon}>+</span>
					</div>
				</div>
				<div className={style.proposalListWrapper} ref={proposalList}>
					{proposalDetailList &&
						proposalDetailList.map((v, i) => (
							<div className={style.proposalItem} key={i}>
								{!v.expand && (
									<div className={style.proposalItemContent}>
										<div className={style.proposalItemHeader}>
											<div
												className={style.proposalItemName}
												onClick={() =>
													router.push({
														pathname: './governance/detail',
														query: { id: v.id },
													})
												}
											>
												{v.title}
											</div>
											<div
												className={`${style.proposalItemStatus} ${
													v.status === 'Active'
														? style.labelActive
														: v.status === 'Failed'
														? style.labelFailed
														: style.labelExecuted
												}`}
											>
												{v.status}
											</div>
											<div
												className={`${style.proposalItemStatus} ${
													v.voteStatus === '1'
														? style.labelFor
														: v.voteStatus === '-1'
														? style.labelAgainst
														: style.labelUnvoted
												}`}
											>
												{v.voteStatus === '1'
													? t('for')
													: v.voteStatus === '-1'
													? t('against')
													: t('unvoted')}
											</div>
										</div>
										<div className={style.proposalItemVoteWrapper}>
											<span className={style.proposalItemVote}>
												{t('for')} {formatNumber(v.for.toString())}
											</span>
											<div className={style.proposalItemVoteVs}>
												<div
													className={style.proposalItemVoteFor}
													style={{
														width: `${v.for
															.dividedBy(v.for.plus(v.against))
															.times(100)
															.toString()}%`,
													}}
												/>
											</div>
											<span className={style.proposalItemVote}>
												{t('against')} {formatNumber(v.against.toString())}
											</span>
										</div>
									</div>
								)}
								{v.expand && (
									<div>
										<div
											className={style.proposalItemName}
											onClick={() =>
												router.push({ pathname: './governance/detail', query: { id: v.id } })
											}
										>
											{v.title}
										</div>
										<div className={style.proposalTable}>
											<div className={style.proposalTableItem}>
												<div>{t('status')}</div>
												<div
													className={
														v.status === 'Active'
															? style.active
															: v.status === 'Failed'
															? style.failed
															: style.executed
													}
												>
													{v.status}
												</div>
											</div>
											<div className={style.proposalTableItem}>
												<div>{t('proposal')}</div>
												<div>BIP #{v.id}</div>
											</div>
											<div className={style.proposalTableItem}>
												<div>{t('start')}</div>
												<div>{v.startDate}</div>
											</div>
											<div className={style.proposalTableItem}>
												<div>{t('end')}</div>
												<div>{v.endDate}</div>
											</div>
											<div className={style.proposalTableItem}>
												<div>{t('voteStatus')}</div>
												<div
													className={`${style.proposalItemStatus} ${
														v.voteStatus === '1'
															? style.for
															: v.voteStatus === '-1'
															? style.against
															: style.unvoted
													}`}
												>
													{v.voteStatus === '1'
														? t('for')
														: v.voteStatus === '-1'
														? t('against')
														: t('unvoted')}
												</div>
											</div>
										</div>
										<div className={style.proposalItemWrapper}>
											<div className={style.vsWrapper}>
												<div className={style.flex}>
													<div>{t('for')}</div>
													<div>{formatNumber(v.for.toString())}</div>
												</div>
												<div className={style.proposalItemVoteVsGray}>
													<div
														className={style.proposalItemVoteForYellow}
														style={{
															width: `${v.for
																.dividedBy(v.for.plus(v.against))
																.times(100)
																.toString()}%`,
														}}
													/>
												</div>
											</div>
											<button
												className={`${style.forBtn} ${
													v.status !== 'Active' ? style.disabled : ''
												}`}
												disabled={v.status !== 'Active'}
												onClick={() => vote(v, true, i)}
											>
												{v.voteStatus === '1' && (
													<Image
														className={style.marginRight5}
														src={rightBlack}
														alt='rightBlack'
													/>
												)}
												<span>{t('for')}</span>
											</button>
										</div>
										<div className={style.proposalItemWrapper}>
											<div className={style.vsWrapper}>
												<div className={style.flex}>
													<div>{t('against')}</div>
													<div>{formatNumber(v.against.toString())}</div>
												</div>
												<div className={style.proposalItemVoteVsGray}>
													<div
														className={style.proposalItemVoteForPurple}
														style={{
															width: `${v.against
																.dividedBy(v.for.plus(v.against))
																.times(100)
																.toString()}%`,
														}}
													/>
												</div>
											</div>
											<button
												className={`${style.againstBtn} ${
													v.status !== 'Active' ? style.disabled : ''
												}`}
												disabled={v.status !== 'Active'}
												onClick={() => vote(v, false, i)}
											>
												{v.voteStatus === '-1' && (
													<Image
														className={style.marginRight5}
														src={rightBlack}
														alt='rightBlack'
													/>
												)}
												<span>{t('against')}</span>
											</button>
										</div>
									</div>
								)}
								<Image
									className={style.proposalItemIcon}
									src={v.expand ? collapse : expand}
									alt='collapse'
									onClick={() => updateExpand(i)}
								/>
							</div>
						))}
				</div>
				<div className={style.moreText} onClick={() => getMoreProposal()}>
					{proposalCount !== proposalShowCount.current
						? isLoading
							? t('loading')
							: t('viewMore')
						: t('noMore')}
				</div>
			</div>
			<div className={showProposalModal ? style.mask : style.hide} ref={maskLayer} onClick={closeProposalModal}>
				<div className={style.proposalModalWrapper}>
					<div className={style.proposalModalTitle}>{t('newProposal')}</div>
					<Image
						className={style.closeBtnImg}
						src={closeBtn}
						alt='closeBtn'
						onClick={() => setShowProposalModal(false)}
					/>
					<div className={style.proposalSubTitle}>
						<span className={style.colorRed}>*</span>
						<span>{t('title')}</span>
					</div>
					<div>
						<input
							type='text'
							className={style.inputStyle}
							placeholder={t('titlePlaceholder')}
							maxLength={50}
							value={newProposalParams.title}
							onChange={(e) => updateParams(e.target.value, 'title')}
							required={true}
						/>
					</div>
					<div className={style.proposalSubTitle}>
						<span className={style.colorRed}>*</span>
						<span>{t('desc')}</span>
					</div>
					<div>
						<textarea
							className={style.inputStyle}
							rows={4}
							placeholder={t('descPlaceholder')}
							value={newProposalParams.description}
							onChange={(e) => updateParams(e.target.value, 'description')}
						/>
					</div>
					<div className={style.proposalSubTitle}>
						<span>Execution Object</span>
					</div>
					<div className={style.proposalSubTitle}>
						<span className={style.colorRed}>*</span>
						<span className={style.proposalSubTitle2}>ScriptHash</span>
						<input
							type='text'
							className={style.inputStyle2}
							placeholder={t('scriptHash')}
							value={newProposalParams.scripthash}
							onChange={(e) => updateParams(e.target.value, 'scripthash')}
						/>
					</div>
					<div className={style.proposalSubTitle}>
						<span className={style.colorRed}>*</span>
						<span className={style.proposalSubTitle2}>Method</span>
						<input
							type='text'
							className={style.inputStyle2}
							placeholder={t('method')}
							value={newProposalParams.method}
							onChange={(e) => updateParams(e.target.value, 'method')}
						/>
					</div>
					{newProposalParams.args &&
						newProposalParams.args.map((item, index) => (
							<div className={style.proposalSubTitle} key={index}>
								<span className={style.proposalSubTitle3}>{index === 0 ? 'Args' : ''}</span>
								<input
									type='text'
									className={style.inputType}
									placeholder={t('argsType')}
									value={item.type}
									onChange={(e) => updateParams(e.target.value, 'type', index)}
								/>
								<input
									type='text'
									className={style.inputStyle2}
									placeholder={t('argsValue')}
									value={item.value}
									onChange={(e) => updateParams(e.target.value, 'value', index)}
								/>
								{newProposalParams.args.length > 1 ? (
									<Image
										src={minusCircle}
										className={style.operateBtn}
										alt='minusCircle'
										onClick={() => updateParams(undefined, 'del', index)}
									/>
								) : null}
								{index === newProposalParams.args.length - 1 ? (
									<Image
										src={addCircle}
										className={style.operateBtn}
										alt='addCircle'
										onClick={() => updateParams(undefined, 'add')}
									/>
								) : (
									<div className={style.operateBtn} />
								)}
							</div>
						))}
					<div className={style.modalBtnWrap}>
						<button className={style.modalBtnCancel} onClick={() => setShowProposalModal(false)}>
							{t('cancel')}
						</button>
						<button className={style.modalBtnSubmit} onClick={() => submit()}>
							{t('submit')}
						</button>
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

export default Governance

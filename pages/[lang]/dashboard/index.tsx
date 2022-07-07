import type { NextPage } from 'next'
import i18next from 'i18next'
import { getAllLanguageSlugs, getLanguage } from '@/resources/i18n/config'
import { useEffect, useState, useRef, MouseEvent } from 'react'
import BigNumber from 'bignumber.js'
import { wallet as NeonWallet, u } from '@cityofzion/neon-js'
import { formatNumber } from '@/resources/utils/convertors'
import SupplyChart from '@/components/SupplyChart'
import RewardChart from '@/components/RewardChart'
import {
	getAgentInfo,
	getTotalNoBug,
	getNoBugInfo,
	getBalance,
	getAccountState,
	getCommitteeDetail,
	getTotalSupply,
	getAssetInfoByContractHash,
	getCandidates,
} from '@/resources/utils/api/rpcApi'
import style from './Dashboard.module.css'
import constants from '@/resources/constants'
import bneoDashboardLogo from '@/resources/images/bneo-dashboard.svg'
import nobugLogo from '@/resources/images/nobug-logo.svg'
import jumpLogo from '@/resources/images/jump-logo.svg'
import closeBtn from '@/resources/images/close-btn-shadow.svg'
import Image from 'next/image'

interface DataList {
	logo: string
	name: string
	balance: string
	totalVotes: string
	scriptHash: string
}

interface ActiveAgents {
	[address: string]: {
		scriptHash: string
		balance: string
	}
}

interface CommitteeNameMap {
	[address: string]: {
		name: string
		logo: string
	}
}

interface AgentInfo {
	type: string
	value: string
}

const Dashboard: NextPage = () => {
	const { t: _t } = i18next
	const t = (s: any) => _t(s, { ns: 'dashboard' })
	const maskLayer = useRef<HTMLDivElement>(null)

	const [agentList, setAgentList] = useState<DataList[]>() // 代理人列表
	const [totalSupply, setTotalSupply] = useState('0') // bneo总供应量
	const [noBugTotalSupply, setNoBugTotalSupply] = useState('0') // nobug总供应量
	const [holder, setHolder] = useState(0) // bneo持有人数量
	const [nbHolder, setNbHolder] = useState(0) // nobug持有人数量
	const [whiteList, setWhiteList] = useState([]) // 节点白名单列表
	const [showWhiteList, setShowWhiteList] = useState(false) // 展示节点白名单列表

	useEffect(() => {
		getTotalSupply().then((res) => {
			setTotalSupply(res?.stack?.[0]?.value ? new BigNumber(res.stack[0].value).shiftedBy(-8).toString() : '0')
		})
		getTotalNoBug().then((res) => {
			const count = res?.stack?.[0]?.value ? new BigNumber(res.stack[0].value).shiftedBy(-10).toString() : '0'
			setNoBugTotalSupply(count)
		})
		getAssetInfoByContractHash(constants.BNEO).then((res) => {
			res?.holders && setHolder(res.holders)
		})
		getNoBugInfo().then((res) => {
			res?.data?.addresses && setNbHolder(res.data.addresses)
		})
		Promise.all([getCandidates(), getAgentInfo(), getCommitteeDetail()]).then(
			async ([candidates, agentInfo, committeeDetail]) => {
				if (candidates?.state === 'HALT' && agentInfo?.state === 'HALT' && committeeDetail?.state === 'HALT') {
					const list = candidates.stack[0].value.reduce((pre: string[], cur: any) => {
						pre.push(u.base642hex(cur.value[0].value))
						return pre
					}, [])
					setWhiteList(list)
					const activeAgents = await agentInfo.stack.reduce(
						async (preValue: Promise<ActiveAgents>, curValue: AgentInfo) => {
							if (curValue.value) {
								const scriptHash = `0x${u.reverseHex(u.base642hex(curValue.value))}`
								await Promise.all([
									getAccountState(constants.NEO, scriptHash),
									getBalance(constants.NEO, scriptHash),
								]).then(async ([res0, res1]) => {
									const publicKey = u.base642hex(res0.stack[0].value[2].value)
									const address = NeonWallet.getAddressFromScriptHash(
										NeonWallet.getScriptHashFromPublicKey(publicKey)
									)
									const balance = res1.stack[0].value
									const prefix = (await preValue)[address] ? '__' : ''
									;(await preValue)[prefix + address] = {
										scriptHash,
										balance,
									}
								})
							}
							return await preValue
						},
						[]
					)
					const committeeNameMap = committeeDetail.stack[0].value.reduce(
						(pre: CommitteeNameMap, cur: any) => {
							const address = NeonWallet.getAddressFromScriptHash(
								u.reverseHex(u.base642hex(cur.value[0].value))
							)
							const logoStr = u.base642utf8(cur.value[9].value)
							let logo = ''
							if (logoStr) {
								logo = /^((http|https|ftp):\/\/)/.test(logoStr)
									? logoStr
									: `${constants.FSID_BASE_URL}/${logoStr}`
							}
							pre[address] = {
								name: u.base642utf8(cur.value[1].value),
								logo,
							}
							return pre
						},
						{}
					)
					const dataList: DataList[] = []
					candidates.stack[0].value.forEach((v: any, i: number) => {
						const publicKey = u.base642hex(v.value[0].value)
						const address = NeonWallet.getAddressFromScriptHash(
							NeonWallet.getScriptHashFromPublicKey(publicKey)
						)
						if (activeAgents[address]) {
							activeAgents[address].vote = v.value[1].value
							dataList.push({
								logo: committeeNameMap[address].logo,
								name: committeeNameMap[address].name || '',
								balance: activeAgents[address].balance,
								totalVotes: activeAgents[address].vote,
								scriptHash: activeAgents[address].scriptHash,
							})
						}
						if (i === candidates.stack[0].value.length - 1) {
							Object.keys(activeAgents).forEach((_addr) => {
								const addr = _addr.slice(2)
								if (_addr.slice(0, 2) === '__') {
									dataList.push({
										logo: committeeNameMap[addr].logo,
										name: committeeNameMap[addr].name || '',
										balance: activeAgents[_addr].balance,
										totalVotes: activeAgents[addr].vote,
										scriptHash: activeAgents[_addr].scriptHash,
									})
								}
							})
							setAgentList(dataList)
						}
					})
				} else {
					console.log('error')
				}
			}
		)
	}, [])

	// 关闭弹窗
	const closeWhiteList = (e: MouseEvent) => {
		if (e.target !== maskLayer.current) {
			return
		}
		setShowWhiteList(false)
	}

	return (
		<div className={style.dashboardWrapper}>
			<div className={`${style.perDashBoardWrapper} ${style.marginTop200}`}>
				<div className={style.logoWrapper}>
					<Image src={bneoDashboardLogo} alt='bneoDashboardLogo' />
					<span className={style.tokenName}>bNEO</span>
				</div>
				<div className={style.infoWrapper}>
					<span>
						{t('supply')}: {formatNumber(totalSupply)}
					</span>
					<span className={style.marginLeft24}>
						{t('holder')}: {formatNumber(holder)}
					</span>
					<span className={style.marginLeftAuto}>
						{t('contractAddress')}: {constants.TOADDRESS}
					</span>
				</div>
				<div className={style.chartsWrapper}>
					<div className={style.chartItemWrappper}>
						<SupplyChart _className={style.supplyChartWrapper}></SupplyChart>
					</div>
					<div className={style.chartItemWrappper}>
						<RewardChart _className={style.supplyChartWrapper}></RewardChart>
					</div>
				</div>
			</div>
			<div className={`${style.perDashBoardWrapper} ${style.marginTop48} ${style.marginBottom32}`}>
				<div className={style.logoWrapper}>
					<Image src={nobugLogo} alt='nobugLogo' />
					<span className={style.tokenName}>NoBug</span>
				</div>
				<div className={`${style.infoWrapper} ${style.marginBottom32}`}>
					<span>
						{t('supply')}: {formatNumber(noBugTotalSupply)}
					</span>
					<span className={style.marginLeft24}>
						{t('holder')}: {formatNumber(nbHolder)}
					</span>
					<span className={style.marginLeftAuto}>
						{t('contractAddress')}: {constants.NOBUGADDRESS}
					</span>
				</div>
			</div>
			<div className={style.agentDashBoardWrapper}>
				<div className={style.agentWrapper}>
					<div className={style.agentHeaderText}>{t('agentInfoTitle')}</div>
					<div className={style.agentHeaderRightWrapper} onClick={() => setShowWhiteList(true)}>
						<span className={style.agentHeaderTextRight}>{t('whiteListEntry')}</span>
						<Image src={jumpLogo} alt='jumpLogo' />
					</div>
				</div>
				<div className={style.listHeader}>
					<div>{t('header1')}</div>
					<div>{t('header2')}</div>
					<div>{t('header3')}</div>
				</div>
				{agentList &&
					agentList.map((v, i) => (
						<div key={i} className={style.listItemWrapper}>
							<img className={style.logo} src={v.logo} alt='logo' />
							<div>{v.name}</div>
							<div>
								{v.balance} / {v.totalVotes}
							</div>
							<div>{v.scriptHash}</div>
						</div>
					))}
			</div>
			{showWhiteList && (
				<div className={style.mask} ref={maskLayer} onClick={closeWhiteList}>
					<div className={style.whiteListBoxWrapper}>
						<div className={style.whiteListTitle}>{t('modalTitle')}</div>
						<div className={style.closeBtnImg}>
							<Image src={closeBtn} alt='closeBtn' onClick={() => setShowWhiteList(false)} />
						</div>
						<p className={style.tip}>{t('modalTip1')}</p>
						<p className={style.tip}>{t('modalTip2')}</p>
						<div className={style.whiteListSubTitle}>{t('modalSubTitle')}</div>
						<div className={style.whiteListWrapper}>
							{whiteList &&
								whiteList.map((v, i) => (
									<div key={i} className={style.whiteListItem}>
										{v}
									</div>
								))}
						</div>
					</div>
				</div>
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

export default Dashboard

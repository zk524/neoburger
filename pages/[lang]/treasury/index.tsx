import type { NextPage } from 'next'
import Image from 'next/image'
import i18next from 'i18next'
import { getAllLanguageSlugs, getLanguage } from '@/resources/i18n/config'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'
import { getNep17Balance } from '@/resources/utils/api/rpcApi'
import BalanceChart from '@/components/BalanceChart'
import { formatNumber } from '@/resources/utils/convertors'
import style from './Treasury.module.css'
import addressIcon from '@/resources/images/address.svg'
import copyIcon from '@/resources/images/copy-gray.svg'
import bneoLogo from '@/resources/images/bneo-logo.svg'
import nbLogo from '@/resources/images/nbLogo.svg'
import list from '@/resources/images/list.svg'
import cost from '@/resources/images/cost.svg'
import gasLogo from '@/resources/images/gas-logo.svg'
import neoBalance from '@/resources/images/neo-balance.svg'
import constants from '@/resources/constants'

const Treasury: NextPage = () => {
	const { t: _t } = i18next
	const t = (s: any) => _t(s, { ns: 'treasury' })
	const [balance, setBalance] = useState(['-', '-', '-'])

	useEffect(() => {
		Promise.all([
			getNep17Balance('NNnM9o2wZcCV84WXzRKeAA1iyDvSRLfUmz'),
			getNep17Balance('NN4jzS1nSRGNdmraNBH4K8KtdD7YG8rxRG'),
		]).then((res) => {
			if (res) {
				const arr = ['0', '0', '0']
				res.forEach((v) => {
					v?.balance &&
						v.balance.forEach((asset: { amount: string; assethash: string }) => {
							if (asset.assethash === constants.BNEO) {
								arr[0] = new BigNumber(asset.amount)
									.shiftedBy(constants[constants.BNEO])
									.plus(arr[0])
									.toString()
							} else if (asset.assethash === constants.GAS) {
								arr[1] = new BigNumber(asset.amount)
									.shiftedBy(constants[constants.GAS])
									.plus(arr[1])
									.toString()
							} else if (asset.assethash === constants.NOBUG) {
								arr[2] = new BigNumber(asset.amount)
									.shiftedBy(constants[constants.NOBUG])
									.plus(arr[2])
									.toString()
							}
						})
				})
				setBalance(arr)
			}
		})
	}, [])

	return (
		<div className={style.treasuryContainer}>
			<h1 className={style.treasuryTitle}>{t('title')}</h1>
			<div className={style.popBg}>
				<div className={style.flex}>
					<Image src={addressIcon} alt='addressIcon' />
					<div className={style.subTitle}>{t('treasuryAddr')}</div>
				</div>
				<div className={`${style.flex} ${style.addressRow}`}>
					<CopyToClipboard text='NNnM9o2wZcCV84WXzRKeAA1iyDvSRLfUmz'>
						<div className={`${style.flex} ${style.whiteBg}`}>
							<span className={style.addrText}>NNnM9o2wZcCV84WXzRKeAA1iyDvSRLfUmz</span>
							<Image src={copyIcon} alt='copyIcon' />
						</div>
					</CopyToClipboard>
					<CopyToClipboard text='NN4jzS1nSRGNdmraNBH4K8KtdD7YG8rxRG'>
						<div className={`${style.flex} ${style.whiteBg}`}>
							<span className={style.addrText}>NN4jzS1nSRGNdmraNBH4K8KtdD7YG8rxRG</span>
							<Image src={copyIcon} alt='copyIcon' />
						</div>
					</CopyToClipboard>
				</div>
			</div>
			<div className={`${style.flex} ${style.stretch}`}>
				<div className={`${style.flexCol} ${style.popBg} ${style.treasuryList}`}>
					<div className={style.flex}>
						<Image src={list} alt='list' />
						<div className={style.subTitle}>{t('treasuryList')}</div>
					</div>
					<div className={style.brownBg}>
						<div className={style.subSubTitle}>NEP-17</div>
						<div className={`${style.flex} ${style.whiteBg2}`}>
							<Image className={style.assetLogo} src={bneoLogo} alt='bneoLogo' />
							<div className={style.assetName}>bNEO</div>
							<div className={style.assetAmount}>{formatNumber(balance[0])}</div>
						</div>
						<div className={`${style.flex} ${style.whiteBg2}`}>
							<Image className={style.assetLogo} src={gasLogo} alt='gasLogo' />
							<div className={style.assetName}>GAS</div>
							<div className={style.assetAmount}>{formatNumber(balance[1])}</div>
						</div>
						<div className={`${style.flex} ${style.whiteBg2}`}>
							<Image className={style.assetLogo} src={nbLogo} alt='nbLogo' />
							<div className={style.assetName}>NoBug</div>
							<div className={style.assetAmount}>{formatNumber(balance[2])}</div>
						</div>
					</div>
				</div>
				<div className={`${style.popBg} ${style.chat}`}>
					<div className={style.flex}>
						<Image src={neoBalance} alt='neoBalance' />
						<div className={style.subTitle}>{t('treasuryBNeoBalance')}</div>
					</div>
					<BalanceChart _className={style.balanceChatWrapper} bNeoAmount={balance[0]}></BalanceChart>
				</div>
			</div>
			<div className={style.popBg}>
				<div className={style.flex}>
					<Image src={cost} alt='cost' />
					<div className={style.subTitle}>{t('cost')}</div>
					<div className={style.rightFlex}>{t('earlyAge')} (2021)</div>
				</div>
				<table className={style.table}>
					<thead>
						<tr className={style.thead}>
							<th>{t('event')}</th>
							<th>{t('costGas')}</th>
							<th>{t('time')}</th>
						</tr>
					</thead>
					<tbody>
						<tr className={style.whiteBg3}>
							<td>{t('event1')}</td>
							<td>10</td>
							<td>09.17</td>
						</tr>
						<tr className={style.whiteBg3}>
							<td>{t('event2')}</td>
							<td>210</td>
							<td>09.17 - 12.31</td>
						</tr>
						<tr className={style.whiteBg3}>
							<td>{t('event3')}</td>
							<td>55</td>
							<td>09.17 - 12.31</td>
						</tr>
						<tr className={style.whiteBg3}>
							<td>{t('event4')}</td>
							<td>2</td>
							<td>12.13</td>
						</tr>
						<tr className={style.whiteBg3}>
							<td>{t('event5')}</td>
							<td>10</td>
							<td>12.14</td>
						</tr>
					</tbody>
				</table>
			</div>
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

export default Treasury

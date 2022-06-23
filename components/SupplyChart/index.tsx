import { FC, useRef, useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'
import i18next from 'i18next'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { getCurrentBlockHeight, getBlockBurgerInfo, getTotalSupply } from '@/resources/utils/api/rpcApi'
import style from './SupplyChart.module.css'

interface Props {
	_className: string
}

const SupplyChart: FC<Props> = ({ _className }) => {
	const { t: _t } = i18next
	const t = (s: any) => _t(s, { ns: 'dashboard' })

	const chartsWrapper = useRef<HTMLDivElement>(null)
	const myChart = useRef<echarts.ECharts | null>(null)

	const [currentBlockHeight, setCurrentBlockHeight] = useState(null)
	const [period, setPeriod] = useState(7)
	const [option, setOption] = useState({})

	useEffect(() => {
		getCurrentBlockHeight().then((res) => {
			setCurrentBlockHeight(res)
		})
		myChart.current = chartsWrapper.current && echarts.init(chartsWrapper.current)
		window.addEventListener('resize', () => {
			myChart.current?.resize()
		})
	}, [])

	useEffect(() => {
		if (!currentBlockHeight) {
			return
		}
		myChart.current?.showLoading({
			text: 'Loading',
			fontWeight: 'bold',
			fontSize: '16px',
			color: '#000000',
			maskColor: 'transparent',
		})
		const newOption = {
			grid: {
				left: 30,
				right: 0,
				top: 30,
				bottom: 30,
			},
			xAxis: {
				type: 'category',
				data: [...new Array(period)].map(() => ''),
				axisLine: {
					show: false,
				},
				axisTick: {
					show: false,
				},
				axisLabel: {
					color: 'rgba(0, 0, 0, 0.4)',
				},
			},
			yAxis: {
				type: 'value',
				splitLine: {
					show: false,
				},
				axisLabel: {
					color: 'rgba(0, 0, 0, 0.4)',
					align: 'left',
					margin: '30',
					formatter: function (value: string) {
						return new BigNumber(value).div(1000).toString() + 'k'
					},
				},
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: {
						opacity: 0.3,
					},
				},
			},
			series: [
				{
					data: [...new Array(period)].map(() => ''),
					type: 'bar',
					itemStyle: {
						color: 'rgba(255, 193, 61, 0.2)',
						emphasis: {
							color: '#FFC13D',
						},
					},
				},
			],
		}
		setOption(newOption)
		let count = 0
		newOption.series[0].data.map((v, key, arr) => {
			if (key === 0) {
				return getTotalSupply().then((res) => {
					count += 1
					newOption.series[0].data[arr.length - 1] = res?.stack?.[0]?.value
						? new BigNumber(res.stack[0].value).shiftedBy(-8).toString()
						: '0'
					newOption.xAxis.data[arr.length - 1] = dayjs().format('MM-DD')
					if (count === arr.length) {
						setOption({ ...newOption })
						myChart.current?.hideLoading()
					}
				})
			} else {
				return getBlockBurgerInfo(new BigNumber(currentBlockHeight).minus(key * 5760).toString()).then(
					(res) => {
						count += 1
						newOption.series[0].data[arr.length - 1 - key] = res?.total_supply
							? new BigNumber(res.total_supply).shiftedBy(-8).toString()
							: ''
						newOption.xAxis.data[arr.length - 1 - key] = res?.timestamp
							? dayjs(res.timestamp).format('MM-DD')
							: ''
						if (count === arr.length) {
							setOption({ ...newOption })
							myChart.current?.hideLoading()
						}
					}
				)
			}
		})
	}, [currentBlockHeight, period])

	useEffect(() => {
		myChart.current?.setOption(option)
	}, [option])

	return (
		<div className={style.chartWrapper}>
			<div className={style.chartName}>{t('supplyChartTitle')}</div>
			<ul className={style.optionWrapper}>
				<li onClick={() => setPeriod(7)} className={`${style.option} ${period === 7 ? style.selected : ''}`}>
					7 {t('days')}
				</li>
				<li onClick={() => setPeriod(30)} className={`${style.option} ${period === 30 ? style.selected : ''}`}>
					30 {t('days')}
				</li>
			</ul>
			<div className={_className} ref={chartsWrapper} />
		</div>
	)
}

export default SupplyChart

import { FC, useRef, useState, useEffect, useCallback } from 'react'
import i18next from 'i18next'
import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { getCurrentBlockHeight, getBlockBurgerInfo, getRewardsPerNEO } from '@/resources/utils/api/rpcApi'
import style from './RewardChart.module.css'

interface Props {
	_className: string
}

const RewardChart: FC<Props> = ({ _className }) => {
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
				},
			},
			tooltip: {
				show: true,
				trigger: 'axis',
				axisPointer: {
					label: {
						fontSize: '10',
						color: 'rgba(255, 255, 255, 0.5)',
					},
					lineStyle: {
						color: '#00E599',
					},
					z: '-1',
				},
			},
			series: [
				{
					data: [...new Array(period)].map(() => ''),
					type: 'line',
					smooth: true,
					showSymbol: false,
					symbolSize: '13',
					itemStyle: {
						color: '#00E599',
					},
					lineStyle: {
						color: '#00E599',
						shadowColor: 'rgba(0, 175, 146, 0.3)',
						shadowBlur: 4,
						shadowOffsetY: 5,
					},
				},
			],
		}
		setOption(JSON.parse(JSON.stringify(newOption)))
		let count = 0
		newOption.series[0].data.map((v, key, arr) => {
			if (key === 0) {
				return getRewardsPerNEO().then((res1) => {
					getBlockBurgerInfo(new BigNumber(currentBlockHeight).minus((key + 1) * 5760).toString()).then(
						(res2) => {
							count += 1
							if (res1?.stack?.[0]?.value && res2?.rps) {
								newOption.series[0].data[arr.length - 1 - key] = new BigNumber(res1.stack[0].value)
									.minus(res2.rps)
									.shiftedBy(-8)
									.toString()
							} else {
								newOption.series[0].data[arr.length - 1 - key] = '0'
							}
							newOption.xAxis.data[arr.length - 1] = dayjs().format('MM-DD')
							if (count === arr.length) {
								setOption(JSON.parse(JSON.stringify(newOption)))
								myChart.current?.hideLoading()
							}
						}
					)
				})
			} else {
				return getBlockBurgerInfo(new BigNumber(currentBlockHeight).minus(key * 5760).toString()).then(
					(res1) => {
						getBlockBurgerInfo(new BigNumber(currentBlockHeight).minus((key + 1) * 5760).toString()).then(
							(res2) => {
								count += 1
								if (res1?.rps && res2?.rps) {
									newOption.series[0].data[arr.length - 1 - key] = new BigNumber(res1.rps)
										.minus(res2.rps)
										.shiftedBy(-8)
										.toString()
								} else {
									newOption.series[0].data[arr.length - 1 - key] = '0'
								}
								newOption.xAxis.data[arr.length - 1 - key] = res1?.timestamp
									? dayjs(res1.timestamp).format('MM-DD')
									: ''
								if (count === arr.length) {
									setOption(JSON.parse(JSON.stringify(newOption)))
									myChart.current?.hideLoading()
								}
							}
						)
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
			<div className={style.chartName}>{t('rewardChartTitle')}</div>
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

export default RewardChart

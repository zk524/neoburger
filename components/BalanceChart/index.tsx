import { FC, useRef, useState, useEffect, useCallback } from 'react'
import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { getCurrentBlockHeight, getBlockBurgerInfo, getRewardsPerNEO } from '@/resources/utils/api/rpcApi'
import style from './BalanceChart.module.css'

interface Props {
	_className: string
	bNeoAmount: string
}

const BalanceChart: FC<Props> = ({ _className, bNeoAmount }) => {
	const chartsWrapper = useRef<HTMLDivElement>(null)
	const myChart = useRef<echarts.ECharts | null>(null)
	const [currentBlockHeight, setCurrentBlockHeight] = useState(null)
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
			backgroundColor: '#FBF9F6',
			grid: {
				left: 30,
				right: 0,
				top: 30,
				bottom: 30,
			},
			xAxis: {
				type: 'category',
				data: [...new Array(30)].map(() => ''),
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
					data: [...new Array(30)].map(() => ''),
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
				count += 1
				newOption.series[0].data[arr.length - 1] = new BigNumber(bNeoAmount).toString()
				newOption.xAxis.data[arr.length - 1] = dayjs().format('MM-DD')
				if (count === arr.length) {
					setOption({ ...newOption })
					myChart.current?.hideLoading()
				}
			} else {
				return getBlockBurgerInfo(new BigNumber(currentBlockHeight).minus(key * 5760).toString()).then(
					(res) => {
						count += 1
						const tee = res?.balance_of_TEE
							? new BigNumber(res.balance_of_TEE).shiftedBy(-8).toString()
							: '0'
						const dao = res?.balance_of_DAO
							? new BigNumber(res.balance_of_DAO).shiftedBy(-8).toString()
							: '0'
						newOption.series[0].data[arr.length - 1 - key] = new BigNumber(tee).plus(dao).toString()
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
	}, [currentBlockHeight, bNeoAmount])

	useEffect(() => {
		myChart.current?.setOption(option)
	}, [option])

	return (
		<div className={style.chartWrapper}>
			<div className={_className} ref={chartsWrapper} />
		</div>
	)
}

export default BalanceChart

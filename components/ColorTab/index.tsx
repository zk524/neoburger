import React, { FC } from 'react'
import style from './ColorTab.module.css'
import vectorLeft from '@/resources/images/vectorLeft.svg'
import vectorRight from '@/resources/images/vectorRight.svg'
import Image from 'next/image'

interface Props {
	value: string
	isSelected?: boolean
	className?: string
	onClick: () => void
}

const ColorTab: FC<Props> = ({ value, isSelected, className: _className, onClick: _onClick }) => {
	return (
		<div className={`${style.tabWrapper} ${_className}`} onClick={_onClick}>
			<Image src={vectorRight} alt='vectorRight' className={`${style.hidden} ${isSelected ? style.show : ''}`} />
			<div className={`${style.tab} ${isSelected ? style.selected : ''}`}>{value}</div>
			<Image src={vectorLeft} alt='vectorLeft' className={`${style.hidden} ${isSelected ? style.show : ''}`} />
		</div>
	)
}

export default ColorTab

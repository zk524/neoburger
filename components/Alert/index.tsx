import { FC } from 'react'
import Image from 'next/image'
import alertErr from '@/resources/images/alert-err.svg'
import style from './Alert.module.css'

interface Props {
	value: string
}

const Alert: FC<Props> = ({ value }) => {
	return (
		<div className={style.wrapper}>
			<div className={style.alertIcon}>
				<Image src={alertErr} alt='alertErr' layout='fixed' />
			</div>
			<span className={style.alertText}>{value}</span>
		</div>
	)
}

export default Alert

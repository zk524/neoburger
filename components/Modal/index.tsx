import { FC, useRef, MouseEvent } from 'react'
import Image from 'next/image'
import i18next from 'i18next'
import error from '@/resources/images/error.svg'
import success from '@/resources/images/success.svg'
import pending from '@/resources/images/pending.svg'
import warning from '@/resources/images/warning.svg'
import close from '@/resources/images/close.svg'
import jump from '@/resources/images/jump.svg'
import style from './Modal.module.css'

interface Props {
	title: string
	status: string
	hint: string
	jumpUrl: string | undefined
	onCancel: () => void
}

const Modal: FC<Props> = ({ title, status, hint, jumpUrl, onCancel }) => {
	const { t } = i18next
	const maskLayer = useRef<HTMLDivElement>(null)

	// 关闭弹窗
	const closeModal = (e: MouseEvent) => {
		if (e.target !== maskLayer.current) {
			return
		}
		onCancel()
	}

	return (
		<div className={style.mask} ref={maskLayer} onClick={closeModal}>
			<div className={style.modal}>
				<div className={style.header}>
					<div className={style.title}>{title}</div>
					<div className={style.close} onClick={() => onCancel()}>
						<Image src={close} alt='close' />
					</div>
				</div>
				<div className={`${style.status} ${status === 'pending' && style.rotate}`}>
					{status === 'success' && <Image src={success} alt='success' />}
					{status === 'error' && <Image src={error} alt='error' />}
					{status === 'pending' && <Image src={pending} alt='pending' />}
					{status === 'warning' && <Image src={warning} alt='warning' />}
				</div>
				<div className={style.hint}>{hint}</div>
				{jumpUrl ? (
					<a className={style.jumpLinkWrapper} href={jumpUrl} target='_blank' rel='noreferrer'>
						<span className={style.jumpLink}>{t('jumpText')}</span>
						<span>
							<Image src={jump} alt='jump' width={24} height={24} />
						</span>
					</a>
				) : null}
			</div>
		</div>
	)
}

export default Modal

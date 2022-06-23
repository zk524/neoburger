import { FC, useEffect, useRef } from 'react'
import { publishError, clearError } from '@/store/features/error'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { BaseError } from '@/resources/utils/error'
import i18next from 'i18next'

export const ErrorHandlder: FC = () => {
	const lastTime = useRef<number | null>(null)
	const lastLocalMessage = useRef<string | null>(null)

	const dispatch = useAppDispatch()
	const error = useAppSelector((state) => state.error.lastError)

	const i18n = i18next

	useEffect(() => {
		window.addEventListener('error', (event) => {
			event.preventDefault()
			if (event.error instanceof Error) {
				dispatch(publishError(event.error))
			}
		})
		window.addEventListener('unhandledrejection', (event) => {
			event.preventDefault()
			if (event.reason instanceof Error) {
				dispatch(publishError(event.reason))
			}
		})
	}, [dispatch])

	useEffect(() => {
		if (error !== null) {
			dispatch(clearError(error))
			if (error instanceof BaseError) {
				// if (error.expose) {
				//     const localMessage = error.getLocalMessage(i18n);
				//     const now = Date.now();
				//     if (localMessage) {
				//         if (
				//             localMessage !== lastLocalMessage.current ||
				//             lastTime.current == null ||
				//             now - lastTime.current > 1000
				//         ) {
				//             alert({ description: localMessage, position: 'top', status: 'error' });
				//             lastLocalMessage.current = localMessage;
				//             lastTime.current = now;
				//         }
				//     }
				//     error.printTraceStack();
				// }
				return
			}
			console.error(error)
		}
	}, [i18n, dispatch, error])

	return null
}

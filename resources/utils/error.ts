import i18next from 'i18next'

enum WalletErrorCodes {
	UnknownError = 'UnknownError',
	NotInstalled = 'NotInstalled',
	NotConnected = 'NotConnected',
	IncorrectNetwork = 'IncorrectNetwork',
	UserRejected = 'UserRejected',
	MalformedInput = 'MalformedInput',
	InsufficientFunds = 'InsufficientFunds',
	CommunicateFailed = 'CommunicateFailed',
	RemoteRpcError = 'RemoteRpcError',
	VerionNotCompatible = 'VerionNotCompatible',
	NoAccount = 'NoAccount',
	UnsupportedNetwork = 'UnsupportedNetwork',
}

enum BackendErrorCodes {
	UnknownError = 'UnknownError',
	NetworkError = 'NetworkError',
	BadRequest = 'BadRequest',
	InternalServiceError = 'InternalServiceError',
	NotFound = 'NotFound',
}

interface BaseErrorOptions {
	cause?: any
	data?: Record<string, any>
}

interface WalletErrorOptions extends BaseErrorOptions {
	code?: WalletErrorCodes
}

interface BackendErrorOptions extends BaseErrorOptions {
	code?: BackendErrorCodes
}

export class BaseError extends Error {
	cause: any
	data: Record<string, any>

	constructor(message?: string, options: BaseErrorOptions = {}) {
		super(message)
		this.cause = options.cause
		this.data = options.data ?? {}
	}

	getLocalMessage(_i18n: any): string {
		return this.message
	}

	printTraceStack(): void {
		console.error(this)
		for (let error = this.cause; error != null; error = error instanceof BaseError ? error.cause : undefined) {
			console.error('Caused by:', error)
		}
	}
}

export class WalletError extends BaseError {
	static readonly Codes = WalletErrorCodes

	code: WalletErrorCodes

	constructor(message?: string, options: WalletErrorOptions = {}) {
		super(message, options)
		this.code = options.code ?? WalletError.Codes.UnknownError
	}

	getLocalMessage(i18n: any): string {
		const { code } = this
		if (i18n.exists(`common:errors.wallet.${code}`)) {
			return i18n.t(`common:errors.wallet.${code}`, this.data)
		}
		return this.message
	}
}

export class BackendError extends BaseError {
	static readonly Codes = BackendErrorCodes

	code: BackendErrorCodes

	constructor(message?: string, options: BackendErrorOptions = {}) {
		super(message, options)
		this.code = options.code ?? BackendError.Codes.UnknownError
	}

	getLocalMessage(i18n: any): string {
		const { code } = this
		if (i18n.exists(`common:errors.backend.${code}`)) {
			return i18n.t(`common:errors.backend.${code}`, this.data)
		}
		return this.message
	}
}

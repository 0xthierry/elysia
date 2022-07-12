import type { Hook, Handler, ParsedRequest, ComposedHandler } from './types'

const jsonHeader = Object.freeze({
	headers: {
		'Content-Type': 'application/json'
	}
})

export const mapResponse = (response: unknown, request: ParsedRequest) => {
	switch (typeof response) {
		case 'string':
			return new Response(response, {
				headers: request.responseHeader
			})

		case 'object':
			return new Response(
				JSON.stringify(response),
				Object.assign(jsonHeader, {
					headers: request.responseHeader
				})
			)

		// case 'function':
		// 	const res = response as Response

		// 	for (const [key, value] of Object.entries(
		// 		request.responseHeader
		// 	))
		// 		res.headers.append(key, value)

		// 	return res

		case 'number':
		case 'boolean':
			return new Response(response.toString(), {
				headers: request.responseHeader
			})

		default:
			break
	}
}

// Currying to merge hook
export const composeHandler = (
	handler: Handler<any, any>,
	hook: Hook<any>
): ComposedHandler => [handler, hook]
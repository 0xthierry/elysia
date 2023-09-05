import { Elysia, t } from '../../src'

import { describe, expect, it } from 'bun:test'
import { post, req, upload } from '../utils'

describe('Validator Edge Case', () => {
	it('validate body', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Object({
				username: t.String(),
				password: t.String()
			})
		})

		const body = JSON.stringify({
			username: 'ceobe',
			password: '12345678'
		})

		const res = await app.handle(
			new Request('http://localhost/', {
				method: 'post',
				body,
				headers: {
					'content-type': 'application/json'
				}
			})
		)

		expect(await res.text()).toBe(body)
		expect(res.status).toBe(200)
	})

	it('validate response', async () => {
		const app = new Elysia()
			.get('/', () => 'Mutsuki need correction 💢💢💢', {
				response: t.String()
			})
			.get('/invalid', () => 1 as any, {
				response: t.String()
			})
		const res = await app.handle(req('/'))
		const invalid = await app.handle(req('/invalid'))

		expect(await res.text()).toBe('Mutsuki need correction 💢💢💢')
		expect(res.status).toBe(200)

		expect(invalid.status).toBe(400)
	})

	it('validate beforeHandle', async () => {
		const app = new Elysia()
			.get('/', () => 'Mutsuki need correction 💢💢💢', {
				beforeHandle() {
					return 'Mutsuki need correction 💢💢💢'
				},
				response: t.String()
			})
			.get('/invalid', () => 1 as any, {
				beforeHandle() {
					return 1 as any
				},
				response: t.String()
			})
		const res = await app.handle(req('/'))
		const invalid = await app.handle(req('/invalid'))

		expect(await res.text()).toBe('Mutsuki need correction 💢💢💢')
		expect(res.status).toBe(200)

		expect(invalid.status).toBe(400)
	})

	it('validate afterHandle', async () => {
		const app = new Elysia()
			.get('/', () => 'Mutsuki need correction 💢💢💢', {
				afterHandle: () => 'Mutsuki need correction 💢💢💢',
				response: t.String()
			})
			.get('/invalid', () => 1 as any, {
				afterHandle: () => 1 as any,
				response: t.String()
			})
		const res = await app.handle(req('/'))
		const invalid = await app.handle(req('/invalid'))

		expect(await res.text()).toBe('Mutsuki need correction 💢💢💢')
		expect(res.status).toBe(200)

		expect(invalid.status).toBe(400)
	})

	it('validate beforeHandle with afterHandle', async () => {
		const app = new Elysia()
			.get('/', () => 'Mutsuki need correction 💢💢💢', {
				beforeHandle() {},
				afterHandle() {
					return 'Mutsuki need correction 💢💢💢'
				},
				response: t.String()
			})
			.get('/invalid', () => 1 as any, {
				afterHandle() {
					return 1 as any
				},
				response: t.String()
			})
		const res = await app.handle(req('/'))
		const invalid = await app.handle(req('/invalid'))

		expect(await res.text()).toBe('Mutsuki need correction 💢💢💢')
		expect(res.status).toBe(200)

		expect(invalid.status).toBe(400)
	})

	it('validate response per status', async () => {
		const app = new Elysia().post(
			'/',
			({ set, body: { status, response } }) => {
				set.status = status

				return response
			},
			{
				body: t.Object({
					status: t.Number(),
					response: t.Any()
				}),
				response: {
					200: t.String(),
					201: t.Number()
				}
			}
		)

		const r200valid = await app.handle(
			post('/', {
				status: 200,
				response: 'String'
			})
		)
		const r200invalid = await app.handle(
			post('/', {
				status: 200,
				response: 1
			})
		)

		const r201valid = await app.handle(
			post('/', {
				status: 201,
				response: 1
			})
		)
		const r201invalid = await app.handle(
			post('/', {
				status: 201,
				response: 'String'
			})
		)

		expect(r200valid.status).toBe(200)
		expect(r200invalid.status).toBe(400)
		expect(r201valid.status).toBe(201)
		expect(r201invalid.status).toBe(400)
	})

	it('handle guard hook', async () => {
		const app = new Elysia().guard(
			{
				query: t.Object({
					name: t.String()
				})
			},
			(app) =>
				app
					// Store is inherited
					.post('/user', ({ query: { name } }) => name, {
						body: t.Object({
							id: t.Number(),
							username: t.String(),
							profile: t.Object({
								name: t.String()
							})
						})
					})
		)

		const body = JSON.stringify({
			id: 6,
			username: '',
			profile: {
				name: 'A'
			}
		})

		const valid = await app.handle(
			new Request('http://localhost/user?name=salt', {
				method: 'POST',
				body,
				headers: {
					'content-type': 'application/json',
					'content-length': body.length.toString()
				}
			})
		)

		expect(await valid.text()).toBe('salt')
		expect(valid.status).toBe(200)

		const invalidQuery = await app.handle(
			new Request('http://localhost/user', {
				method: 'POST',
				body: JSON.stringify({
					id: 6,
					username: '',
					profile: {
						name: 'A'
					}
				})
			})
		)

		expect(invalidQuery.status).toBe(400)

		// const invalidBody = await app.handle(
		// 	new Request('http://localhost/user?name=salt', {
		// 		method: 'POST',
		// 		body: JSON.stringify({
		// 			id: 6,
		// 			username: '',
		// 			profile: {}
		// 		})
		// 	})
		// )

		// expect(invalidBody.status).toBe(400)
	})

	// https://github.com/elysiajs/elysia/issues/28
	// Error is possibly from reference object from `registerSchemaPath`
	// Most likely missing an deep clone object
	it('validate group response', async () => {
		const app = new Elysia().group('/deep', (app) =>
			app
				.get('/correct', () => 'a', {
					response: {
						200: t.String(),
						400: t.String()
					}
				})
				.get('/wrong', () => 1 as any, {
					response: {
						200: t.String(),
						400: t.String()
					}
				})
		)

		const correct = await app
			.handle(req('/deep/correct'))
			.then((x) => x.status)
		const wrong = await app.handle(req('/deep/wrong')).then((x) => x.status)

		expect(correct).toBe(200)
		expect(wrong).toBe(400)
	})

	it('validate union', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Union([
				t.Object({
					password: t.String()
				}),
				t.Object({
					token: t.String()
				})
			])
		})

		const r1 = await app
			.handle(
				post('/', {
					password: 'a'
				})
			)
			.then((x) => x.status)
		const r2 = await app
			.handle(
				post('/', {
					token: 'a'
				})
			)
			.then((x) => x.status)
		const r3 = await app
			.handle(
				post('/', {
					notUnioned: true
				})
			)
			.then((x) => x.status)

		expect(r1).toBe(200)
		expect(r2).toBe(200)
		expect(r3).toBe(400)
	})

	it('convert File to Files automatically', async () => {
		const app = new Elysia().post(
			'/',
			({ body: { files } }) => Array.isArray(files),
			{
				body: t.Object({
					files: t.Files()
				})
			}
		)

		expect(
			await app
				.handle(
					upload('/', {
						files: 'aris-yuzu.jpg'
					}).request
				)
				.then((x) => x.text())
		).toEqual('true')

		expect(
			await app
				.handle(
					upload('/', {
						files: ['aris-yuzu.jpg', 'midori.png']
					}).request
				)
				.then((x) => x.text())
		).toEqual('true')
	})
})

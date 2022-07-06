import KingWorld, { type Plugin } from './index'

interface Store {
    a: string
    id: number
}

const app = new KingWorld<Store>()

interface PluginStore {
    asdf: 'a'
}

const plugin: Plugin<{ prefix?: string }, PluginStore> = (
    app,
    { prefix = '/fbk' } = {}
) =>
    app
        .state('asdf', 'a')
        .when('onRequest', (store) => {})
        .group(prefix, (app) => {
            app.get('/plugin', () => 'From Plugin')
        })

app.register(plugin)
    .get('/', () => 'KINGWORLD')
    .register((app) =>
        app.group('/nested', (app) => app.get('/awawa', (_, store) => 'Hi'))
    )
    .get('/kw', () => 'KINGWORLD', {
        preHandler: ({ query }, store) => {
            if (query?.name === 'aom') return 'Hi saltyaom'
        }
    })
    .get('/id/:id', ({ params, query }) => {
        console.log({
            params,
            query
        })

        return params.id
    })
    .get('/json', () => ({
        hi: 'world'
    }))
    .group('/group', (app) => {
        app.when('preHandler', ({ query }) => {
            if (query?.name === 'aom') return 'Hi saltyaom'
        })
            .get('/hi', () => 'HI GROUP')
            .get('/kingworld', () => 'Welcome to KINGWORLD')
            .get('/fbk', () => 'FuBuKing')
    })
    .get('/identity', (_, store) => {
        console.log(store.a)

        return 'hi'
    })
    .default(
        () =>
            new Response('Not Found :(', {
                status: 404
            })
    )
    .listen(8080)

console.log('🦊 KINGWORLD is running at :8080')


const port = process.env.PORT ? parseInt(process.env.PORT) : 5000
const portOffset = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0
const actualPort = port + portOffset

const Express = require('express')
const cors = require('cors');
const expressStaticGzip = require('express-static-gzip')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')

const app = new Express()

const user = require('./user')
const supervisor = require('./supervisor')
const acl = require('./supervisor/acl')
const references = require('./references')
const dashboards = require('./dashboards')
const userflow = require('./userflow')
const searchdata = require('./searchdata')
const print = require('./print')
const mails = require('./mails')
const render = require('./render')
const landing = require('./landing')
const landreferences = require('./landing_references')

if (process.env.DB_INSTANCE === 'school_fest') {
    const cron = require('./cron')
}

const { composePublicToken, getObjId } = require('./utils')
app.use(bodyParser.json({limit: '5mb'}))
// const userss = {
//     _id: getObjId("653777d8cbe760ca6d828ec0"),
//     email: "sv-kuro@yandex.ru",
//     createdAt: 1698133976612,
//     password: "$2b$10$upzO0Chdgog7I9fnyxECU.iiwBAmUoykl4f5X/eTwK6mCAcqHVMBi"
// }
// console.log(composePublicToken(userss));

// console.log(composePublicToken({
//   "_id": getObjId("657774ebe6a16f29b5e345fe"),
//   "email": "rsi1987@yandex.ru",
//   "stamp": 1702327531855,
//   "roles": {}
// }))

app.use(cors());

app.use(fileUpload({}))

app.use('*', (req, res, next)  => {
    res.header('Access-Control-Allow-Origin', req.header('origin'))
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Headers', 'Authorization, SignedBy, signedby, accept, content-type, content_type, Origin, X-Requested-With, Content-Type, Accept, sec-ch-ua, sec-ch-ua-mobile, baggage, sentry-trace, Debug-Origin')
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, PATCH, OPTIONS, PURGE')
    next()
})

app.use('/assets', expressStaticGzip('assets'))

app.use('*', (req, res, next) => {
    if(req.method === 'DELETE') {
        if (req.baseUrl.includes('landrefs')) {
            next()
        } else {
            res.status(403).json({success: false, message: 'Method not allowed'})
            return
        }
    } else {

        // if ((req.headers && req.headers.origin && req.headers.origin === 'https://fests.rfs.ru') || (portOffset < 4 )) {
        //     req.isProdFront = true
        // } else {
        //     req.isProdFront = false
        // }
        if (!process.env.INSTANCE || process.env.INSTANCE === 'development') {
            req.selfHost = 'https://fest-api.rfsgr.ru/'
            req.TEACHER_BE_URL = 'https://teachers-api.rfsgr.ru/';
            req.isProdFront = false
        } else {
            if (process.env.DB_INSTANCE === 'school_fest_preprod') {
                req.selfHost = 'https://preprod-api-fests.rfs.ru/'
                req.TEACHER_BE_URL = 'http://localhost:5004/';
                req.isProdFront = false
            } else {
                req.selfHost = 'https://api-fests.rfs.ru/'
                req.TEACHER_BE_URL = 'http://localhost:5006/';
                req.isProdFront = true
            }
        }
        next()
    }
})

app.use('/render/:id?', render)
app.use('/mails/:subject', mails)
app.use('/print/:view/:id', print)
app.use('/user/:path', user)
app.use('/svr/:path/:id?', acl)
app.use('/svr/:path/:id?', supervisor)
app.use('/userflow/:flow/:item?', userflow)
app.get('/dashboards/:path', dashboards)
app.get('/searchdata/:sample', searchdata)
app.use('/storage', expressStaticGzip('storage', () => null))
app.use('/reports', expressStaticGzip('reports', () => null))
app.use('/refs/:collection/:id?', references)

app.use('/landing/:flow/:item?', landing)
app.use('/landrefs/:collection/:id?', landreferences)
app.use('/publicdocs', expressStaticGzip('publicdocs', () => null))

console.log('Listening port', actualPort)
app.listen(actualPort)

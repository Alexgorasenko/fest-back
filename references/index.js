const service = require('../service')
const fs = require('fs')
const dirs = fs.readdirSync(__dirname+'/cols')
const { getObjId, isEmptyOrNull, decodePublicUserToken } = require('../utils')
const path = require('path');
const workers = ['list.js', 'item.js', 'put.js', 'post.js']
const logger = require('../logger');

const cols = {}

for(let dir of dirs) {
    if(dir !== 'index.js') {
        const sub = fs.readdirSync(`${__dirname}/cols/${dir}`)
        cols[dir] = {}
        for(let flow of sub) {
            if(workers.includes(flow)) {
                cols[dir][flow.replace('.js', '')] = require(`${__dirname}/cols/${dir}/${flow}`)
            }
        }
    }
}
//console.log('cols', cols);

module.exports = async (req, res) => {
    const { collection, id } = req.params

    const objIdItem = getObjId(id);

    if (id && !objIdItem) {
        res.status(400).json({error: true, msg: 'check params'})
        return null
    }
    const authorization = req.headers.authorization || req.headers.Authorization || null;
    if ( authorization ) {
        req.signer = decodePublicUserToken(authorization);
    }

    if (!req.signer) {
        res.status(401).json({error: true, msg: 'check auth'})
        return null
    }
    let resp_sending = false;

    try {

        let method = null;

        switch (req.method) {
            case 'PUT':
                method = 'put'
                break;
            case 'POST':
                //if(req.params.collection && req.params.id) {
                method = 'post'
                break
            case 'GET':
                if(objIdItem) {
                    method = 'item'
                } else {
                    method = 'list'
                }
                break
            default:
                break
        }
        if (!collection ||
            !cols[collection] ||
            !method ||
            !cols[collection][method] ||
            (method === 'put' && (!objIdItem || isEmptyOrNull(req.body))) ||
            (method === 'post' && isEmptyOrNull(req.body))
        ) {
            res.status(400).json({error: true, msg: 'check method'})
            return null
        }

        const resp = await cols[collection][method](req, objIdItem)

        if (resp.errorStatus) {
            res.status(resp.errorStatus).json(resp)
            resp_sending = true
        } else {
            if (resp.file) {
                const pathToFile = path.join(`${__dirname}`, `../`, resp.file);
                //console.log('pathToFile', pathToFile);
                //const exists = ;

                if (!fs.existsSync(pathToFile)) {
                    res.status(400).json({error: true, msg: 'file not found'})
                    return null
                }

                res.sendFile(pathToFile)
                //res.download(pathToFile)
                resp_sending = true
            } else {
                res.json(resp)
                resp_sending = true
            }
        }
        if (['put','post'].includes(method)) {
            await logger({
                action: method,
                collection,
                id: objIdItem || "",
                authorCollection: 'supervisors',
                authorId: req.signer._id,
                author: req.signer.email || "no_mail",
                patch: req.body
            })
        }
    } catch(e) {
        console.log('Server error')
        console.log(e)
        if (!resp_sending) {
            res.json({error: true, msg: 'server error'})
        }
    }
}

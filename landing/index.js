const service = require('../service')
const fs = require('fs')
const axios = require('axios')

const dirs = fs.readdirSync(__dirname+'/flows')
const { getObjId, isEmptyOrNull } = require('../utils')
const { decomposeToken } = require('./tokens')

const path = require('path');

const flows = {}

for(let dir of dirs) {
    if(!['index.js','index.js'].includes(dir)) {
        const sub = fs.readdirSync(`${__dirname}/flows/${dir}`)
        flows[dir] = {}
        for(let flow of sub) {
            if(flow.includes('module')) {
                flows[dir][flow.replace('.js', '')] = require(`${__dirname}/flows/${dir}/${flow}`)
            }
        }
    }
}
const no_auth = ["signin", 'init', 'docs', 'get_doc', 'getFestNumbers', 'onboarding', 'completeManager', 'recoveryManager','applyRecoveryManager','checkManager'];

const S3_BASE = `https://s3.megafon.cloud/${process.env.FILES_BUCKET_ID}/`;

module.exports = async (req, res) => {
    const { flow, item } = req.params

    const objIdItem = ['docs'].includes(flow) ? item : getObjId(item);

    if (item && !objIdItem) {
        res.status(400).json({error: true, msg: 'check params'})
        return null
    }
    let resp_sending = false;

    if (req.method === "OPTIONS") {
        res.status(200).json({})
        return null
    }
    if (!no_auth.includes(flow)) {
        const authorization = req.headers.authorization || req.headers.Authorization || null;

        if ( !authorization ) {
            res.status(401).json({error: true, msg: 'проверьте авторизацию'})
            return null
        }

        req.signer = decomposeToken(authorization);

        if ( !req.signer || !req.signer._id ) {
            res.status(401).json({error: true, msg: 'проверьте авторизацию'})
            return null
        }
        const entry = await service.fetch({collection: 'contentmanagers', _id: getObjId(req.signer._id), asEntry: true})

        if (!entry) {
            res.status(401).json( {success: false, errorStatus: 401, message: `проверьте авторизацию`})
            return {success: false, errorStatus: 401, message: `проверьте авторизацию`}
        }

        const { _id, createdAt, email, hashPwd, deactivated, blocked, verified } = entry

        if (deactivated || blocked || (verified !== undefined && !verified)) {
            res.status(401).json( {success: false, errorStatus: 401, message: `Учетная запись недоступна`})
            return {success: false, errorStatus: 401, message: `Учетная запись недоступна`}
        }

        if (!flows[flow]) {
            res.status(404).json({error: true, msg: 'flow not found'})
            return null
        }
    }

    try {

        const resp = await flows[flow].module(req, objIdItem)

        /*if (!resp) {
            res.json(resp)
            return {}
        }*/

        if (resp && resp.errorStatus) {
            res.status(resp.errorStatus).json(resp)
            resp_sending = true
        } else {
            if (resp.file) {
                const pathToFile = path.join(`${__dirname}`, `./`, resp.file);
                console.log('pathToFile', pathToFile);

                if (!fs.existsSync(pathToFile)) {
                    res.status(400).json({error: true, msg: 'file not found'})
                    return null
                }

                res.sendFile(pathToFile)

            } else {
                res.json(resp)
                resp_sending = true
            }
        }

    } catch(e) {
        console.log('Server error')
        console.log(e)
        if (!resp_sending) {
            res.json({error: true, msg: 'server error'})
        }
    }
}

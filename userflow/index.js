const service = require('../service')
const fs = require('fs')
const axios = require('axios')

const dirs = fs.readdirSync(__dirname+'/flows')
const { getObjId, isEmptyOrNull, decodePublicUserToken } = require('../utils')
const path = require('path');

const flows = {}

for(let dir of dirs) {
    if(dir !== 'index.js') {
        const sub = fs.readdirSync(`${__dirname}/flows/${dir}`)
        flows[dir] = {}
        for(let flow of sub) {
            if(flow.includes('module')) {
                flows[dir][flow.replace('.js', '')] = require(`${__dirname}/flows/${dir}/${flow}`)
            }
        }
    }
}

const S3_BASE = `https://s3.megafon.cloud/${process.env.FILES_BUCKET_ID}/`;

module.exports = async (req, res) => {
    const { flow, item } = req.params
    const objIdItem = getObjId(item);

    if (item && !objIdItem) {
        res.status(400).json({error: true, msg: 'check params'})
        return null
    }
    const authorization = req.headers.authorization || req.headers.Authorization || null;
    if ( authorization ) {
        req.signer = decodePublicUserToken(authorization);
    }

    if (!req.signer) {
        if (!["get_teacher", "preflow", "get_active_fest", 'get_public_docs'].includes(flow)) {
            res.status(401).json({error: true, msg: 'check auth'})
            return null
        }
    } else {
        req.signer.collection = 'publicusers'
    }
    if (!flows[flow]) {
        res.status(404).json({error: true, msg: 'flow not found'})
        return null
    }
    let resp_sending = false;
    try {

        const resp = await flows[flow].module(req, objIdItem)

        if (!resp) {
            res.json(resp)
            return {}
        }

        if (resp.errorStatus) {
            res.status(resp.errorStatus).json(resp)
            resp_sending = true
        } else {
            if (resp.file) {

                /*const pathToFile = path.join(`${__dirname}`, `../`, resp.file);
                //console.log('pathToFile', pathToFile);
                //const exists = ;

                if (!fs.existsSync(pathToFile)) {
                    res.status(400).json({error: true, msg: 'file not found'})
                    return null
                }

                res.sendFile(pathToFile)
                */
                const urlToFile = S3_BASE + resp.file;
                console.log('urlToFile', urlToFile);
                const bufData = await axios.get(urlToFile, {responseType: 'arraybuffer'})
                //const buffer = Buffer.from(bufData.data, 'base64');

                res.set({ 'Content-Type': `application/octet-stream`, 'Content-Length': bufData.data.length })
                res.write(new Buffer(bufData.data), 'binary')
                res.end()
                //res.download(pathToFile)
                resp_sending = true
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

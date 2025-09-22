const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId
//const generator = require('generate-password')
const bcrypt = require('bcrypt')
const SALT_ROUNDS = 10
const logger = require('../logger');
const { composeVerifyToken } = require('./tokens')
const sender = require('../mails/sender')

module.exports = async (req, res) => {
    const { roles } = req
    if(!roles || (!roles.rfu_admin && !roles.superadmin)) {
        res.status(403).send({error: true, message: 'Not enough permissions'})
    } else {
        const { uid, target } = req.body

        if(!uid || uid.length !== 24) {
            res.status(400).send({error: true, message: 'Marlormed user id'})
        } else {
            // const pwd = generator.generate({
            //     length: 9,
            //     numbers: true,
            //     excludeSimilarCharacters: true
            // })

            try {
                //const hash = await hashPwd(pwd)
                const entry = await service.fetch({collection: target, _id: new ObjectId(uid), asEntry: true})

                if (!entry) {
                    res.status(400).send({error: true, message: `Data by id ${uid} not found`})
                    return {}
                }

                if (!entry.email) {
                    res.status(400).send({error: true, message: `email in data ${uid} not found`})
                    return {}
                }

                const token = composeVerifyToken({...entry, password: null})
                const segment = target === 'publicusers' ? 'account' : 'admin'

                if (process.env.INSTANCE && process.env.INSTANCE !== 'development') {
                    try {
                        await sender({
                            subject: 'Восстановление пароля',
                            reciever: entry.email,
                            input: {
                                recoveryAccess: true,
                                link: req.isProdFront ? `https://fests.rfs.ru/${segment}/restore?token=${token}` : `https://preprod-fests.rfs.ru/${segment}/restore?token=${token}`
                            }
                        })
                    } catch (e) {
                        console.log('catch sending', e);
                        res.status(500).json({success: false, message: `secong sending email failed`})
                        return
                    }
                }
                const patch = target === 'publicusers' ? {password: null, recovery: token} : {password: null, token: token}

                await service.update({collection: target, _id: new ObjectId(uid)}, patch)

                res.json({success: true})
                await logger({
                    action: "put",
                    collection: target,
                    id: uid,
                    authorCollection: 'supervisors',
                    authorId: req.signer._id || req.signer.uid,
                    author: req.signer.email || "no_mail",
                    patch: patch
                })

            } catch (e) {
                console.log(e);
                res.status(500).send({error: true, message: 'Internal server error'})
            }
        }
    }
}

const hashPwd = str => {
    return new Promise((resolve, reject) => {
        bcrypt
            .hash(str, SALT_ROUNDS)
            .then(hash => {
                resolve(hash)
            })
            .catch(err => {
                reject()
            })
    })
}

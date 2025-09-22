const bcrypt = require('bcrypt')
const service = require('../service')
const sender = require('../mails/sender')
const logger = require('../logger');

const { composeVerifyToken } = require('./tokens')

const SALT_ROUNDS = 10

const patchOptions = {
    moderator: {'roles.moderator': true},
    rfu_admin: {'roles.rfu_admin': true}
}

const checkPermissionsModel = (roles, targetType) => {
    return (Object.keys(patchOptions).includes(targetType) || targetType === 'region_admin') && (roles.superadmin || (roles.rfu_admin && targetType.includes('_admin')))
}

module.exports = async (req, res) => {
    const { body, roles } = req
    const missing = ['email', 'name'].filter(k => !body[k] || !body[k].length)

    const hasPerms = checkPermissionsModel(roles, body.type)

    if(hasPerms) {
        if(missing.length) {
            res.status(400).json({success: false, message: `One or more parameters missing: ${missing.join(',')}`})
        } else {
            body.email = body.email.trim().toLowerCase();

            const entry = await service.fetch({collection: 'supervisors', email: body.email, asEntry: true})
            if(entry) {
                res.status(409).json({success: false, message: `Supervisor with email ${body.email} already exists`})
            } else {
                try {
                    const namesLength = body.name.trim().split(" ")
                    if (namesLength.length < 2) {
                        res.status(400).json({success: false, message: `Некорректное значение в ФИО`})
                        return {}
                    }
                    const user = await service.save({collection: 'supervisors'}, {
                        name: body.name.trim(),
                        email: body.email,
                        createdAt: new Date().getTime(),
                        password: null,
                        roles: body.roles && body.roles.region_admin ? body.roles : {}
                    })

                    if(user && user._id) {
                        if(patchOptions[body.type]) {
                            await service.update({collection: 'supervisors', _id: user._id}, patchOptions[body.type])
                        }

                        const initToken = composeVerifyToken(user)
                        await service.update({collection: 'supervisors', _id: user._id}, {token: initToken})



                        if(process.env.INSTANCE === 'remote') {
                            await sender({
                                subject: 'Доступ к личному кабинету',
                                reciever: body.email,
                                input: {
                                    initSvr: true,
                                    link: req.isProdFront ? `https://fests.rfs.ru/auth/complete?token=${initToken}` : `https://preprod-fests.rfs.ru/auth/complete?token=${initToken}`
                                }
                            })
                        }

                        res.json((!process.env.INSTANCE || process.env.INSTANCE === 'development') ? {success: true, pseudoLink: `/auth/complete?token=${initToken}`} : {success: true})

                        await logger({
                            action: "post",
                            collection: "supervisors",
                            id: user._id || "",
                            authorCollection: 'supervisors',
                            authorId: req.signer._id || req.signer.uid,
                            author: req.signer.email || "no_mail",
                            patch: body
                        })
                    } else {
                        res.status(500).json({success: false, message: `Server error while creating user entry`})
                    }
                } catch(e) {
                    console.log(e)
                    res.status(500).json({success: false, message: `Server error while creating user entry`})
                }
            }
        }
    } else {
        res.status(403).json({success: false, message: `Permissions denied`})
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

const bcrypt = require('bcrypt')
const service = require('../service')
const sender = require('../mails/sender')
const logger = require('../logger');

const { composeVerifyToken } = require('./tokens')

const SALT_ROUNDS = 10

module.exports = async (req, res) => {
    const { body } = req
    const missing = ['email', 'name', 'password'].filter(k => !body[k] || !body[k].length)
    if(missing.length) {
        res.status(400).json({success: false, message: `One or more parameters missing: ${missing.join(',')}`})
    } else {
        const entry = await service.fetch({collection: 'publicusers', email: body.email, asEntry: true})
        if(entry) {
            if(entry.verified || entry.blocked) {
                res.status(409).json({success: false, message: `User with email ${body.email} already exists`})
                return
            } else {
                if(!entry.createCounter || entry.createCounter < 5) {
                    const tokenToSend = composeVerifyToken(entry);

                    if (process.env.INSTANCE && process.env.INSTANCE !== 'development') {
                        try {
                            await sender({
                                subject: 'Подтверждение аккаунта',
                                reciever: body.email,
                                input: {
                                    verify: true,
                                    link: req.isProdFront ? `https://fests.rfs.ru/account/verify?token=${tokenToSend}` : `https://preprod-fests.rfs.ru/account/verify?token=${tokenToSend}`
                                }
                            })
                        } catch (e) {
                            console.log('catch sending', e);
                            res.status(500).json({success: false, message: `secong sending email failed`})
                            return

                        }
                    }

                    await service.update({collection: 'publicusers', _id: entry._id}, {
                    createCounter: entry.createCounter ? entry.createCounter + 1 : 1});

                    res.json({success: true})
                    return
                } else {
                    await service.update({collection: 'publicusers', _id: entry._id}, {
                    createCounter: entry.createCounter ? entry.createCounter + 1 : 1, blocked: true});
                    res.status(400).json({success: false, message: `Пользователь запросил письмо подтверждения более 5 раз`})
                    return
                }
            }
        } else {
            try {
                const namesLength = body.name.trim().split(" ")
                if (namesLength.length < 2) {
                    res.status(400).json({success: false, message: `Некорректное значение в ФИО`})
                    return {}
                }

                const hashed = await hashPwd(body.password)
                const user = await service.save({collection: 'publicusers'}, {
                    name: body.name.trim(),
                    email: body.email,
                    createdAt: new Date().getTime(),
                    password: hashed
                })

                if(user && user._id) {
                    const tokenToSend = composeVerifyToken(user)

                    if(process.env.INSTANCE === 'remote') {
                        await sender({
                            subject: 'Подтверждение аккаунта',
                            reciever: body.email,
                            input: {
                                verify: true,
                                link: req.isProdFront ? `https://fests.rfs.ru/account/verify?token=${tokenToSend}` : `https://preprod-fests.rfs.ru/account/verify?token=${tokenToSend}`
                            }
                        })
                    }

                    res.json(process.env.INSTANCE === 'remote' ? {success: true} : {success: true, verify: `/account/verify?token=${tokenToSend}`})

                    await logger({
                        action: "post",
                        collection: "publicusers",
                        id: user._id || "",
                        authorCollection: 'publicusers',
                        authorId: user._id || user.uid,
                        author: user.email || "no_mail",
                        patch: body
                    })
                } else {
                    res.status(500).json(user || {success: false, message: `Server error while creating user entry`})
                }
            } catch(e) {
                console.log('catch create', e);
                res.status(500).json({success: false, message: `Server error while creating user entry`})
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

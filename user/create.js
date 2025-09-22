
//const bcrypt = require('bcrypt')
const service = require('../service')
const sender = require('../mails/sender')
const logger = require('../logger');
const { validatePwd, hashPwd } = require('../utils');
const { composeVerifyToken } = require('./tokens')

//const SALT_ROUNDS = 10
module.exports = async (req, res) => {
    const { body } = req
    const missing = ['email', 'name', 'password'].filter(k => !body[k] || !body[k].length)
    //console.log('body', body);

    if(missing.length) {
        res.status(400).json({success: false, message: `Пропущен параметр: ${missing.join(',')}`})
    } else {
        body.email = body.email.trim().toLowerCase();

        const entry = await service.fetch({collection: 'publicusers', email: body.email, asEntry: true})

        let svr = await service.fetch({collection: 'supervisors', email: body.email, asEntry: true})

        const userPatch = {};

        if(svr) {
            if(svr.verified) {
                userPatch.verified = true;
                if(svr.blocked) {
                    userPatch.blocked= true;
                }
            }
        }

        if(entry) {
            if(entry.verified ) {
                if(entry.blocked) {
                    res.status(409).json({success: false, message: `Пользователь с почтой ${body.email} заблокирован`})
                    return {}
                }
                res.status(409).json({success: false, message: `Пользователь с почтой ${body.email} уже подтвердил почту`})
                return {}
            } else {

                if(userPatch.blocked) {
                    res.status(409).json({success: false, message: `Пользователь с почтой ${body.email} заблокирован`})
                    userPatch.blocked= true;
                    await service.update({collection: 'publicusers', _id: entry._id}, userPatch)
                    return {}
                }

                if(userPatch.verified) {
                    res.status(409).json({success: false, message: `Пользователь с почтой ${body.email} уже подтвердил почту`})
                    await service.update({collection: 'publicusers', _id: entry._id}, userPatch)

                    return {}
                }

                if(!entry.createCounter || entry.createCounter < 5) {
                    const tokenToSend = composeVerifyToken(entry);

                    if (process.env.INSTANCE && process.env.INSTANCE !== 'development') {
                        try {
                            await sender({
                                subject: 'Подтверждение аккаунта',
                                reciever: body.email,
                                input: {
                                    verify: true,
                                    link: req.isProdFront ? `https://fests.rfs.ru/auth?token=${tokenToSend}` : `https://preprod-fests.rfs.ru/auth?token=${tokenToSend}`
                                }
                            })
                        } catch (e) {
                            console.log('catch sending', e);
                            res.status(500).json({success: false, message: `ошибка отправки письма на почту ${body.email}`})
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

                let hashedPwd = await hashPwd(body.password);
                if (svr && svr.password && !validatePwd(svr.password, hashedPwd)) {
                    console.log('WRONG PASS WITH SVR', svr._id);
                    hashedPwd = svr.password;
                }
                const hashedName = body.name.trim();

                const userBody = {
                    name: hashedName,
                    email: body.email,
                    createdAt: new Date().getTime(),
                    password: hashedPwd,
                    ...userPatch
                }
                const user = await service.save({collection: 'publicusers'}, userBody)

                if(user && user._id) {
                    const tokenToSend = composeVerifyToken({...userBody, _id: user._id})

                    if(process.env.INSTANCE === 'remote') {
                        if(!userBody.verified) {
                            await sender({
                                subject: 'Подтверждение аккаунта',
                                reciever: body.email,
                                input: {
                                    verify: true,
                                    link: req.isProdFront ? `https://fests.rfs.ru/auth?token=${tokenToSend}` : `https://preprod-fests.rfs.ru/auth?token=${tokenToSend}`
                                }
                            })
                        } else {
                            await sender({
                                subject: 'Подтверждение аккаунта',
                                reciever: body.email,
                                input: {
                                    verify: true,
                                    link: req.isProdFront ? `https://fests.rfs.ru/auth` : `https://preprod-fests.rfs.ru/auth`
                                }
                            })
                        }
                    }

                    res.json(process.env.INSTANCE === 'remote' ? {success: true} : {success: true, verify: `/auth?token=${tokenToSend}`})

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
                    res.status(500).json(user || {success: false, message: `серверная ошибка создания записи пользователя`})
                }
            } catch(e) {
                console.log('catch create', e);
                res.status(500).json({success: false, message: `серверная ошибка создания записи пользователя`})
            }
        }
    }
}

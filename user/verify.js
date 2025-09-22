const { decomposeToken } = require('./tokens')
const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = async (req, res) => {
    const { candidate } = req.body
    if(!candidate) {
        res.status(400).send({error: true, message: 'Не передан токен'})
    } else {
        try {
            const { _id, email, createdAt } = decomposeToken(candidate)

            if(!email) {
                res.status(400).json({success: false, message: 'Некорректный токен'})
                return {}
            }

            let entry = await service.fetch({collection: 'publicusers', _id: new ObjectId(_id)})

            const isPublicAuth = !!entry;

            let svr = await service.fetch({collection: 'supervisors', _id: new ObjectId(_id)})

            if(!entry && !svr) {
                res.status(400).json({success: false, message: 'Некорректный токен'})
                return {}
            }

            if(entry && email !== entry.email) {
                res.status(400).json({success: false, message: 'Некорректный токен'})
                return {}
            }

            if(svr && email !== svr.email) {
                res.status(400).json({success: false, message: 'Некорректный токен'})
                return {}
            }


            if (!entry) {
                entry = await service.fetch({collection: 'publicusers', email: svr.email, asEntry: true})
            }
            if (!svr) {
                svr = await service.fetch({collection: 'supervisors', email: entry.email, asEntry: true})
            }

            if(!entry) {
                await service.update({collection: 'supervisors', _id: svr._id}, {verified: true})
                res.json({success: true, email: email})
            } else {
                if(entry.verified) {
                    res.status(409).json({success: false, message: 'Почта уже подтверждена'})
                    if (svr && !svr.verified) {
                        await service.update({collection: 'supervisors', _id: svr._id}, {verified: true})
                    }
                } else {
                    if (svr) {
                        if (svr.verified) {
                            res.status(409).json({success: false, message: 'Почта уже подтверждена'})

                            await service.update({collection: 'publicusers', _id: entry._id}, {verified: true})
                            return {}
                        }

                        await service.update({collection: 'publicusers', _id: entry._id}, {verified: true})
                        await service.update({collection: 'supervisors', _id: svr._id}, {verified: true})

                        res.json({success: true})
                    } else {
                        if(isPublicAuth && email === entry.email && createdAt === entry.createdAt) {
                            await service.update({collection: 'publicusers', _id: entry._id}, {verified: true})
                            res.json({success: true})
                        } else {
                            res.status(410).json({success: false, message: 'Некорректный токен'})
                        }
                    }
                }
            }
        } catch (e) {
            res.status(500).json({success: false, message: 'Ошибка сервера при подтверждении токена'})
        }
    }
}

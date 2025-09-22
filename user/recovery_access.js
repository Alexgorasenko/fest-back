const bcrypt = require('bcrypt')
const service = require('../service')
const { decomposeToken } = require('./tokens')
const { hashedStr, decodeHash, hashPwd } = require('../utils');

module.exports = async (req, res) => {
    const { password, recovery_token } = req.body

    if(!password || !recovery_token) {
        res.status(400).json({success: false, message: 'Проверьте параметры'})
        return {}
    }

    const decoded = decomposeToken(recovery_token)

    if (!decoded.email) {
        res.status(400).json({success: false, message: 'Проверьте параметры'})
        return {}
    }
    const hash = await hashPwd(password)

    let entry = await service.fetch({collection: 'publicusers', email: decoded.email, asEntry: true})

    let svr = await service.fetch({collection: 'supervisors', email: decoded.email, asEntry: true})

    if(!entry) {
        if(!svr) {
            res.status(404).json({success: false, message: 'Пользователь не найден'})
            return {}
        }
        if(!svr.recovery) {
            res.status(410).json({success: false, message: 'Токен просрочен'})
            return {}
        }
        if(svr.recovery === recovery_token) {
            await service.update({collection: 'supervisors', _id: svr._id}, {password: hash, recovery: null})

            res.json({success: true})
        } else {
            res.status(409).json({success: false, message: 'Некорректный токен'})
        }
    } else {
        if(!entry.recovery) {
            res.status(410).json({success: false, message: 'Токен просрочен'})
        } else {
            if(entry.recovery === recovery_token) {
                await service.update({collection: 'publicusers', _id: entry._id}, {password: hash, recovery: null})

                if(svr) {
                    await service.update({collection: 'supervisors', _id: svr._id}, {password: hash, recovery: null})
                }
                res.json({success: true})
            } else {
                res.status(409).json({success: false, message: 'Некорректный токен'})
            }
        }
    }
}

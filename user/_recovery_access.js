const bcrypt = require('bcrypt')
const service = require('../service')
const { decomposeToken } = require('./tokens')
const ObjectId = require('mongoose').Types.ObjectId

const SALT_ROUNDS = 10

module.exports = async (req, res) => {
    const { password, recovery_token } = req.body

    if(!password || !recovery_token) {
        res.status(400).json({success: false, message: 'Missing or empty arguments.'})
    } else {
        try {
            const decoded = decomposeToken(recovery_token)
            const entry = await service.fetch({collection: 'publicusers', _id: new ObjectId(decoded._id)})
            if(!entry) {
                res.status(404).json({success: false, message: 'User not found.'})
            } else {
                if(!entry.recovery) {
                    res.status(410).json({success: false, message: 'Token expired'})
                } else {
                    if(entry.recovery === recovery_token) {
                        const hash = await hashPwd(password)
                        await service.update({collection: 'publicusers', _id: entry._id}, {password: hash, recovery: null})

                        res.json({success: true})
                    } else {
                        res.status(409).json({success: false, message: 'Invalid token'})
                    }
                }
            }
        } catch(e) {
            res.status(500).json({success: false, message: 'Invalid token'})
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

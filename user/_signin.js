const bcrypt = require('bcrypt')
const service = require('../service')
const { commonCompose } = require('./tokens')

const SALT_ROUNDS = 10

module.exports = async (req, res) => {
    const { email, password } = req.body

    const entry = await service.fetch({collection: 'publicusers', email: email, asEntry: true})
    if(entry) {
        if(!entry.verified) {
            res.status(409).json({success: false, message: `Email ${email} not verified`})
        } else {
            const valid = await validatePwd(password, entry.password)
            if(valid) {
                const { _id, createdAt, email, password } = entry
                const tokenToSend = commonCompose({_id, createdAt, email, hash: password})

                res.status(200).json({token: tokenToSend})
            } else {
                res.status(401).json({success: false, message: `Invalid password`})
            }
        }
    } else {
        res.status(401).json({success: false, message: `Invalid email`})
    }
}

const validatePwd = (password, hash) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, result) => {
            resolve(result)
        })
    })
}

const bcrypt = require('bcrypt')
const service = require('../service')
const { commonCompose } = require('./tokens')

const SALT_ROUNDS = 10

module.exports = async (req, res) => {
    const { email, password } = req.body

    const entry = await service.fetch({collection: 'supervisors', email: email, asEntry: true})
    if(entry) {
        if(!entry.verified) {
            res.status(409).json({success: false, message: `Email ${email} not verified`})
        } else {
            if(entry.blocked) {
                res.status(403).json({success: false, message: `User blocked`})
            } else {
                const valid = await validatePwd(password, entry.password)
                const {region_admin, ...restRoles} = entry.roles
                const tknPayload = {email: entry.email, stamp: entry.createdAt, roles: restRoles, _id: entry._id}
                const token = commonCompose(tknPayload)
                if(valid) {
                    res.status(200).json({ token })
                } else {
                    res.status(401).json({success: false, message: `Invalid password`})
                }
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

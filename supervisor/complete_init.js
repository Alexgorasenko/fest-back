const service = require('../service')
const bcrypt = require('bcrypt')
const { commonCompose } = require('./tokens')
const { hashPwd } = require('../utils')

module.exports = async (req, res) => {
    const { password, token, email } = req.body

    if(!token || !password) {
        res.status(400).send({error: true, message: 'Missing parameters'})
        return {}
    }

    const entry = await service.fetch({collection: 'supervisors', token: token, asEntry: true})

    if(entry) {
        const hashed = await hashPwd(password)

        await service.update({collection: 'supervisors', _id: entry._id}, {password: hashed, token: null, verified: true})

        const {region_admin, ...restRoles} = entry.roles

        const tknPayload = {email: entry.email, stamp: entry.createdAt, roles: restRoles, _id: entry._id}

        const authToken = commonCompose(tknPayload)

        res.json({success: true, authToken: authToken})

        if (entry.email) {
            let public = await service.fetch({collection: 'publicusers', email: entry.email, asEntry: true})
            if (public) {
                await service.update({collection: 'publicusers', _id: public._id}, {password: hashed, recovery: null})
            }
        }
    } else {
        res.status(404).send({error: true, message: 'User not found'})
    }
}

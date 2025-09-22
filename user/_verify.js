const { decomposeToken } = require('./tokens')
const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = async (req, res) => {
    const { candidate } = req.body

    try {
        const { _id, email, createdAt } = decomposeToken(candidate)

        const entry = await service.fetch({collection: 'publicusers', _id: new ObjectId(_id)})
        if(!entry) {
            res.status(400).json({success: false, message: 'Invalid token'})
        } else {
            if(entry.verified) {
                res.status(409).json({success: false, message: 'Token already used'})
            } else {
                if(email === entry.email && createdAt === entry.createdAt) {
                    await service.update({collection: 'publicusers', _id: entry._id}, {verified: true})
                    res.json({success: true})
                } else {
                    res.status(410).json({success: false, message: 'Invalid token'})
                }
            }
        }
    } catch (e) {
        res.status(500).json({success: false, message: 'Internal server error while veryfying email'})
    }
}

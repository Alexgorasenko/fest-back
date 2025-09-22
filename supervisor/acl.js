const { decomposeToken } = require('./tokens')
const service = require('../service')

module.exports = async (req, res, next) => {
    const { path } = req.params

    if(['signin', 'verify_init', 'complete_init'].includes(path)) {
        next()
    } else {
        const { authorization } = req.headers
        if(!authorization) {
            res.status(401).json({success: false, message: 'Unauthorized'})
        } else {
            const decoded = decomposeToken(authorization)
            const entry = await service.fetch({collection: 'supervisors', email: decoded.email, asEntry: true})
            if(entry) {
                if(!entry.blocked) {
                    if(decoded.stamp === entry.createdAt || decoded.createdAt === entry.createdAt) {
                        req.roles = entry.roles;
                        req.signer = {...entry, uid: entry._id}
                        next()
                    } else {
                        res.status(400).json({success: false, message: 'Invalid token'})
                    }
                } else {
                    res.status(403).json({success: false, message: 'User blocked'})
                }
            } else {
                res.status(404).json({success: false, message: 'User not found'})
            }
        }
    }
}

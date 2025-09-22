const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../logger');

module.exports = async (req, res) => {
    const { roles } = req
    if(!roles || (!roles.rfu_admin && !roles.superadmin)) {
        res.status(403).send({error: true, message: 'Not enough permissions'})
    } else {
        const { id } = req.params

        if(!id || id.length !== 24) {
            res.status(400).send({error: true, message: 'Marlormed user id'})
        } else {
            const { body } = req
            const { target, ...rest } = body

            if(!body || !Object.keys(body).length) {
                res.status(400).send({error: true, message: 'Marlormed requiest body'})
            } else {
                try {
                    await service.update({collection: target, _id: new ObjectId(id)}, rest)

                    await logger({
                        action: "put",
                        collection: target,
                        id: id,
                        authorCollection: 'supervisors',
                        authorId: req.signer._id || req.signer.uid,
                        author: req.signer.email || "no_mail",
                        patch: rest
                    })

                    res.json({success: true})
                } catch(e) {
                    res.status(500).send({error: true, message: 'Internal server error'})
                }
            }
        }
    }
}

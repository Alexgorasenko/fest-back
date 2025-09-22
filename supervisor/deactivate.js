const service = require('../service')
const logger = require('../logger');
const { getObjId } = require('../utils')

module.exports = async (req, res) => {
    const { roles, params } = req
    const { id } = params

    if(!roles.superadmin && !roles.rfu_admin) {
        res.status(403).json({success: false, message: `не хватает прав`})
        return {}
    }

    if (!id || !getObjId(id)) {
        res.status(400).json({success: false, message: `Проверьте параметры`})
        return {}
    }

    const entry = await service.fetch({collection: 'supervisors', _id: getObjId(id)})

    if(!entry) {
        const contentManager = await service.fetch({collection: 'contentmanagers', _id: getObjId(id)})
        if(!contentManager) {
            res.status(409).json({success: false, message: `учетная запись не найдена`})
            return {}
        }
        await service.update({collection: 'contentmanagers', _id: getObjId(id)}, {deactivated: true})

        res.json({success: true});

        await logger({
            action: "put",
            collection: "contentmanagers",
            id: getObjId(id),
            authorCollection: 'supervisors',
            authorId: req.signer._id || req.signer.uid,
            author: req.signer.email || "no_mail",
            patch: {deactivated: true}
        })
        return {}
    }

    await service.update({collection: 'supervisors', _id: entry._id}, {deactivated: true})

    res.json({success: true});

    await logger({
        action: "put",
        collection: "supervisors",
        id: entry._id || "",
        authorCollection: 'supervisors',
        authorId: req.signer._id || req.signer.uid,
        author: req.signer.email || "no_mail",
        patch: {deactivated: true}
    })

}

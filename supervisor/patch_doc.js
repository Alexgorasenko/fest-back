const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { patchQuery } = require('../modules')
const logger = require('../logger');

const moment = require('moment');

module.exports = async (req, res) => {
    const { id } = req.params
    const { superadmin, moderator } = req.roles

    const {_id, ...patch} = req.body

    try {
        const userObjId = getObjId(req.signer.uid)
        const docId = getObjId(id)

        if (!docId) {
            res.status(400).json({success: false, message: 'проверьте параметры запроса'})
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }
        const doc = await service.fetch({collection: 'publicdocs', _id: docId})
        if (!doc) {
            res.status(400).json({success: false, message: `Документ ${id} не найден. проверьте параметры`, errorStatus: 400})
            return null
        }

        let queryUpd = await service.update({collection: 'publicdocs', _id: docId}, patch)

        await logger({
            action: "put",
            collection: "publicdocs",
            id: id || "",
            authorCollection: req.signer.collection || 'supervisors',
            authorId: req.signer._id,
            author: req.signer.email || "no_mail",
            patch: patch
        })

        res.json({success: true})

    } catch (e) {
        console.log('SV patch query failed', e);
        res.status(500).json({success: false, message: 'SV patch query failed'})
        return {success: false, message: 'SV patch query failed', errorStatus: 500}
    }
}

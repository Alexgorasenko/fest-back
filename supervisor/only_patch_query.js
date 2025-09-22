const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { patchQuery } = require('../modules')

const moment = require('moment');

module.exports = async (req, res) => {
    const { id } = req.params
    const { superadmin, moderator } = req.roles

    try {
        const userObjId = getObjId(req.signer.uid)
        const queryId = getObjId(id)

        if (!queryId) {
            res.status(400).json({success: false, message: 'проверьте параметры запроса'})
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }
        const query = await service.fetch({collection: 'queries', _id: queryId})
        if (!query) {
            res.status(400).json({success: false, message: `Заявка ${queryId} не найдена. проверьте параметры`, errorStatus: 400})
            return null
        }
        const {_id, attachmentReports, finishedReports, isPrintFormGetted, attachmentFormId, ...patch} = req.body

        const result = await patchQuery({body: patch, item: id, userObjId: userObjId, signer: req.signer})

        if (result.errorStatus) {
            res.status(result.errorStatus).json(result)
        } else {
            res.json(result)
        }

    } catch (e) {
        console.log('SV patch query failed', e);
        res.status(500).json({success: false, message: 'SV patch query failed'})
        return {success: false, message: 'SV patch query failed', errorStatus: 500}
    }
}

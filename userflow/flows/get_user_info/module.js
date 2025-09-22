const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { query_pipeline, festival_pipeline } = require('../../../pipelines')

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const entry = await service.fetch({collection: 'publicusers', pipeline: [
            {$match: {
                _id: userId
            }},
            {$project: {password: 0}}
        ]});

        if (!entry) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }

        return {
            success: true,
            data: entry
        }

    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

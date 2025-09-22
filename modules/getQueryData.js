const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { query_pipeline, festival_pipeline } = require('../pipelines')
const getFestPreloadData = require('./getFestPreloadData')

const moment = require('moment');

module.exports = async (item) => {
    try {
        const queryId = getObjId(item)

        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const query = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                _id: queryId
            }},
            ...query_pipeline
        ], asEntry: true})

        if (!query) {
            return {success: false, message: 'Заявка не найдена', errorStatus: 400}
        }
        const fest = await getFestPreloadData({_id: query.festivalId})

        return {success: true, data: {...query, festival: fest}}
    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

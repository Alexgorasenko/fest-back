const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingfeedbacks', pipeline: [
            {$match: filter},
            {$lookup: {
                from: 'attachments',
                localField: 'policy.policyFileId',
                foreignField: '_id',
                as: 'policyFile'
            }},
            {$lookup: {
                from: 'attachments',
                localField: 'persData.persDataFileId',
                foreignField: '_id',
                as: 'persDataFile'
            }},
            {$set: {
                policyFile: {'$arrayElemAt': ['$policyFile', 0]},
                persDataFile: {'$arrayElemAt': ['$persDataFile', 0]},
            }}
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingfeedbacks ', e);
        return {success: false, message: 'landingfeedbacks list failed', errorStatus: 500}
    }
}

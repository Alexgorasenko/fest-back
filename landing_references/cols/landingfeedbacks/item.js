const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingfeedbacks', pipeline: [
            {$match: {_id: id}},
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
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landingfeedbacks ', e);
        return {success: false, message: 'landingfeedbacks failed', errorStatus: 500}
    }
}

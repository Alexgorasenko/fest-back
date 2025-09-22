const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingwinners', pipeline: [
            {$match: {_id: id}},
            {$lookup: {
                from: 'attachments',
                localField: 'fileId',
                foreignField: '_id',
                as: 'winnersListFile'
            }},
            {$set: {
                winnersListFile: {'$arrayElemAt': ['$winnersListFile', 0]},
            }}
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landingwinners ', e);
        return {success: false, message: 'landingwinners failed', errorStatus: 500}
    }
}

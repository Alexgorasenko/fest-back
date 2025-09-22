const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingwinners', pipeline: [
            {$match: filter},
            {$lookup: {
                from: 'attachments',
                localField: 'fileId',
                foreignField: '_id',
                as: 'winnersListFile'
            }},
            {$set: {
                winnersListFile: {'$arrayElemAt': ['$winnersListFile', 0]},
            }}
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingwinners ', e);
        return {success: false, message: 'landingwinners list failed', errorStatus: 500}
    }
}

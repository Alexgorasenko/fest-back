const service = require('../../../service');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingexternallinks', pipeline: [
            {$match: filter},
            {$lookup: {
                from: 'attachments',
                localField: 'file.fileId',
                foreignField: '_id',
                as: 'fileData'
            }},
            {$set: {
                fileData: {'$arrayElemAt': ['$fileData', 0]},
            }}
        ]});

        return {success: true, data: list}
    } catch (e) {
        console.log('landingexternallinks ', e);
        return {success: false, message: 'landingexternallinks list failed', errorStatus: 500}
    }
}

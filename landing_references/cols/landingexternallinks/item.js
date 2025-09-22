const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingexternallinks', pipeline: [
            {$match: {_id: id}},
            {$lookup: {
                from: 'attachments',
                localField: 'file.fileId',
                foreignField: '_id',
                as: 'fileData'
            }},
            {$set: {
                fileData: {'$arrayElemAt': ['$fileData', 0]},
            }}
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landingexternallinks ', e);
        return {success: false, message: 'landingexternallinks failed', errorStatus: 500}
    }
}

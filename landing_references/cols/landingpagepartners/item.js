const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingpagepartners', pipeline: [
            {$match: {_id: id}},
            // {$lookup: {
            //     from: 'festivals',
            //     localField: 'festivalId',
            //     foreignField: '_id',
            //     as: 'festival'
            // }},
            // {$set: {
            //     festival: {'$arrayElemAt': ['$festival', 0]}
            // }}
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landingpagepartners ', e);
        return {success: false, message: 'landingpagepartners failed', errorStatus: 500}
    }
}

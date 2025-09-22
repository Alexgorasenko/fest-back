const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingpartners', pipeline: [
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
        console.log('landingpartners ', e);
        return {success: false, message: 'landingpartners failed', errorStatus: 500}
    }
}

const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'activities', pipeline: [
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
        ]});

        return {success: true, data: entry}

    } catch (e) {
        console.log('activities ', e);
        return {success: false, message: 'activities failed', errorStatus: 500}
    }
}

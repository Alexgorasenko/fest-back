const service = require('../../../service');

module.exports = async (req, id) => {
    try {

        const entry = await service.fetch({collection: 'nominations', pipeline: [
            {$match: {_id: id}},
            {$lookup: {
                from: 'educationlevels',
                localField: '_id',
                foreignField: 'nominationId',
                as: 'levels'
            }},
        ]});

        return {success: true, data: entry}

    } catch (e) {
        console.log('ref nominations', e);
        return {success: false, message: 'ref nominations failed', errorStatus: 500}
    }
}

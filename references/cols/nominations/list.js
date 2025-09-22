const service = require('../../../service');
const { getObjId } = require('../../../utils')

module.exports = async (req, id) => {
    try {
        const { festivalId } = req.query;
        const filter = {};
        if (festivalId) {
            if (getObjId(festivalId)) {
                filter.festivalId = getObjId(festivalId)
            } else {
                return {success: false, message: 'check params', errorStatus: 400}
            }
        }
        const list = await service.fetch({collection: 'nominations', pipeline: [
            {$match: filter},
            {$lookup: {
                from: 'educationlevels',
                localField: '_id',
                foreignField: 'nominationId',
                as: 'levels'
            }},
        ]});
        
        return {success: true, data: list}
    } catch (e) {
        console.log('ref nominations', e);
        return {success: false, message: 'ref nominations failed', errorStatus: 500}
    }
}

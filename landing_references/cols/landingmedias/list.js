const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const { directionId, isVisible, limit, page=0 } = req.query;

        if (directionId && getObjId(directionId)) {
            filter.directionId = getObjId(directionId)
        }
        if (isVisible === 'true') {
            filter.isVisible = true
        } else if (isVisible === 'false') {
            filter.isVisible = false
        }
        const pipeDef = [{$match: filter}, {$sort: {_id: -1}}]

        const outData = {}

        if (limit && !isNaN(+limit) && +limit) {
            pipeDef.push(
                {$skip: page * limit},
                {$limit: +limit}
            )

            const listCount = await service.count({collection: 'landingmedias', pipeline: [
                {$match: filter},
            ]})

            const totalPages = Math.ceil(listCount / +limit)

            outData.count = listCount;
            outData.totalPages = totalPages;
            outData.currentPage = +page + 1;
        }

        const list = await service.fetch({collection: 'landingmedias', pipeline: [
            ...pipeDef,            
        ]});

        return {success: true, data: list, ...outData}

    } catch (e) {
        console.log('landingmedias ', e);
        return {success: false, message: 'landingmedias list failed', errorStatus: 500}
    }
}

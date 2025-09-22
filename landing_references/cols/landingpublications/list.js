const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};
        const { directionId, isVisible, limit, page=0 } = req.query;

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
                ...pipeDef,
            ]})

            const totalPages = Math.ceil(listCount / +limit)

            outData.count = listCount;
            outData.totalPages = totalPages;
            outData.currentPage = +page + 1;
        }

        const list = await service.fetch({collection: 'landingpublications', pipeline: [
            ...pipeDef,
        ]});

        return {success: true, data: list, ...outData}

    } catch (e) {
        console.log('landingpublications ', e);
        return {success: false, message: 'landingpublications list failed', errorStatus: 500}
    }
}

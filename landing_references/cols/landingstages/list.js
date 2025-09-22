const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingstages', pipeline: [
            {$match: filter}
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingstages ', e);
        return {success: false, message: 'landingstages list failed', errorStatus: 500}
    }
}

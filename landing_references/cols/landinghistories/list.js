const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landinghistories', pipeline: [
            {$match: filter},
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landinghistories ', e);
        return {success: false, message: 'landinghistories list failed', errorStatus: 500}
    }
}

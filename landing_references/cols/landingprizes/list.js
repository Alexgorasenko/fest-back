const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingprizes', pipeline: [
            {$match: filter}
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingprizes ', e);
        return {success: false, message: 'landingprizes list failed', errorStatus: 500}
    }
}

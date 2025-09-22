const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingfirstpages', pipeline: [
            {$match: filter},
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingfirstpages ', e);
        return {success: false, message: 'landingfirstpages list failed', errorStatus: 500}
    }
}

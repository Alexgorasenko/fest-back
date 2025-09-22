const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingdocs', pipeline: [
            {$match: filter},
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingdocs ', e);
        return {success: false, message: 'landingdocs list failed', errorStatus: 500}
    }
}

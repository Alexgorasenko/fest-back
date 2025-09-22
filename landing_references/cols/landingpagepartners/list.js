const service = require('../../../service');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingpagepartners', pipeline: [
            {$match: filter},
        ]});

        return {success: true, data: list}
    } catch (e) {
        console.log('landingpagepartners ', e);
        return {success: false, message: 'landingpagepartners list failed', errorStatus: 500}
    }
}

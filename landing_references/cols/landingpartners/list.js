const service = require('../../../service');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingpartners', pipeline: [
            {$match: filter},
        ]});

        return {success: true, data: list}
    } catch (e) {
        console.log('landingpartners ', e);
        return {success: false, message: 'landingpartners list failed', errorStatus: 500}
    }
}

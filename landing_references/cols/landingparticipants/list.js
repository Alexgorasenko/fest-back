const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingparticipants', pipeline: [
            {$match: filter}
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingparticipants ', e);
        return {success: false, message: 'landingparticipants list failed', errorStatus: 500}
    }
}

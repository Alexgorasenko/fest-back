const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const filter = {};

        const list = await service.fetch({collection: 'landingnews', pipeline: [
            {$match: filter},
        ]});

        return {success: true, data: list}

    } catch (e) {
        console.log('landingnews ', e);
        return {success: false, message: 'landingnews list failed', errorStatus: 500}
    }
}

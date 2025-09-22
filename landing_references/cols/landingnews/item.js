const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingnews', pipeline: [
            {$match: {_id: id}},
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landingnews ', e);
        return {success: false, message: 'landingnews failed', errorStatus: 500}
    }
}

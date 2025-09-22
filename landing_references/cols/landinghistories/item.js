const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landinghistories', pipeline: [
            {$match: {_id: id}},
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landinghistories ', e);
        return {success: false, message: 'landinghistories failed', errorStatus: 500}
    }
}

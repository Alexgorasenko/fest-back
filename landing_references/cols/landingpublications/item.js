const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingpublications', pipeline: [
            {$match: {_id: id}},
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landingpublications ', e);
        return {success: false, message: 'landingpublications failed', errorStatus: 500}
    }
}

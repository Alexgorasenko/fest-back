const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'landingmedias', pipeline: [
            {$match: {_id: id}},
        ], asEntry: true});

        return entry ? {success: true, data: entry} : {success: false, msg: 'data not found'}
    } catch (e) {
        console.log('landingmedias ', e);
        return {success: false, message: 'landingmedias failed', errorStatus: 500}
    }
}

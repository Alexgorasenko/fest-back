const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        const entry = await service.findOneAndUpdate({collection: 'organizations', match: {_id: id}}, patch);

        return {success: true, data: entry}

    } catch (e) {
        console.log('organizations put', e);
        return {success: false, message: 'organizations put failed', errorStatus: 500}
    }
}

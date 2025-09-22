const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        const entry = await service.findOneAndUpdate({collection: 'regions', match: {_id: id}}, patch);

        return {success: true, data: entry}

    } catch (e) {
        console.log('region', e);
        return {success: false, message: 'region failed', errorStatus: 500}
    }
}

const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        const entry = await service.findOneAndUpdate({collection: 'nominations', match: {_id: id}}, patch);

        return {success: true, data: entry}
    } catch (e) {
        console.log('nominations', e);
        return {success: false, message: 'nominations failed', errorStatus: 500}
    }
}

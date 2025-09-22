const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        let entry = await service.findOneAndUpdate({collection: 'landingpartners', match: {_id: id}}, patch)

        return {success: true, data: entry}
    } catch (e) {
        console.log('landingpartners put', e);
        return {success: false, message: 'landingpartners put failed', errorStatus: 500}
    }
}

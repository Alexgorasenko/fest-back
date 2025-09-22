const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        let entry = await service.findOneAndUpdate({collection: 'landingpagepartners', match: {_id: id}}, patch)

        return {success: true, data: entry}
    } catch (e) {
        console.log('landingpagepartners put', e);
        return {success: false, message: 'landingpagepartners put failed', errorStatus: 500}
    }
}

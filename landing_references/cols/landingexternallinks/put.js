const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        let entry = await service.findOneAndUpdate({collection: 'landingexternallinks', match: {_id: id}}, patch)

        return {success: true, data: entry}
    } catch (e) {
        console.log('landingexternallinks put', e);
        return {success: false, message: 'landingexternallinks put failed', errorStatus: 500}
    }
}

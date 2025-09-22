const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        let entry = await service.findOneAndUpdate({collection: 'landingfeedbacks', match: {_id: id}}, patch)

        return {success: true, data: entry}
    } catch (e) {
        console.log('landingfeedbacks put', e);
        return {success: false, message: 'landingfeedbacks put failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        let entry = await service.findOneAndUpdate({collection: 'landingstages', match: {_id: id}}, patch)

        return {success: true, data: entry}
    } catch (e) {
        console.log('landingstages put', e);
        return {success: false, message: 'landingstages put failed', errorStatus: 500}
    }
}

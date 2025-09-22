const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        let entry = await service.findOneAndUpdate({collection: 'landingwinners', match: {_id: id}}, patch)

        return {success: true, data: entry}
    } catch (e) {
        console.log('landingwinners put', e);
        return {success: false, message: 'landingwinners put failed', errorStatus: 500}
    }
}

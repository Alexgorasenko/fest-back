const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingwinners'}, body);
        if (!data._id) {
            return {success: false, message: 'landingwinners post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingwinners', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingwinners post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingwinners err', e);
        return {success: false, message: 'landingwinners failed', errorStatus: 500}
    }
}

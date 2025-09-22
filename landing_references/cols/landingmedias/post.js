const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingmedias'}, body);
        if (!data._id) {
            return {success: false, message: 'landingmedias post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingmedias', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingmedias post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingmedias err', e);
        return {success: false, message: 'landingmedias failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingprizes'}, body);
        if (!data._id) {
            return {success: false, message: 'landingprizes post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingprizes', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingprizes post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingprizes err', e);
        return {success: false, message: 'landingprizes failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingstages'}, body);
        if (!data._id) {
            return {success: false, message: 'landingstages post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingstages', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingstages post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingstages err', e);
        return {success: false, message: 'landingstages failed', errorStatus: 500}
    }
}

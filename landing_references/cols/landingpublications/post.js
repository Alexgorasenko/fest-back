const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingpublications'}, body);
        if (!data._id) {
            return {success: false, message: 'landingpublications post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingpublications', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingpublications post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingpublications err', e);
        return {success: false, message: 'landingpublications failed', errorStatus: 500}
    }
}

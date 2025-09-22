const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landinghistories'}, body);
        if (!data._id) {
            return {success: false, message: 'landinghistories post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landinghistories', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landinghistories post failed', errorStatus: 500}

    } catch (e) {
        console.log('landinghistories err', e);
        return {success: false, message: 'landinghistories failed', errorStatus: 500}
    }
}

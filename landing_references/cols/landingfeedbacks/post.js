const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingfeedbacks'}, body);
        if (!data._id) {
            return {success: false, message: 'landingfeedbacks post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingfeedbacks', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingfeedbacks post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingfeedbacks err', e);
        return {success: false, message: 'landingfeedbacks failed', errorStatus: 500}
    }
}

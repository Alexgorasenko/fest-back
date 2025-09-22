const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingfirstpages'}, body);
        if (!data._id) {
            return {success: false, message: 'landingfirstpages post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingfirstpages', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingfirstpages post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingfirstpages err', e);
        return {success: false, message: 'landingfirstpages failed', errorStatus: 500}
    }
}

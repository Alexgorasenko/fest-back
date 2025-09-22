const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingparticipants'}, body);
        if (!data._id) {
            return {success: false, message: 'landingparticipants post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingparticipants', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingparticipants post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingparticipants err', e);
        return {success: false, message: 'landingparticipants failed', errorStatus: 500}
    }
}

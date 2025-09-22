const service = require('../../../service');
module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingpartners'}, body);
        if (!data._id) {
            return {success: false, message: 'landingpartners post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingpartners', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingpartners post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingpartners err', e);
        return {success: false, message: 'landingpartners failed', errorStatus: 500}
    }
}

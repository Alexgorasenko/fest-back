const service = require('../../../service');
module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingpagepartners'}, body);
        if (!data._id) {
            return {success: false, message: 'landingpagepartners post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingpagepartners', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingpagepartners post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingpagepartners err', e);
        return {success: false, message: 'landingpagepartners failed', errorStatus: 500}
    }
}

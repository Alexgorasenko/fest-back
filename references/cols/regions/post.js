const service = require('../../../service');
module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'regions'}, body);
        if (!data._id) {
            return {success: false, message: 'region post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'regions', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'region post failed', errorStatus: 500}

    } catch (e) {
        console.log('region', e);
        return {success: false, message: 'region failed', errorStatus: 500}
    }
}

const service = require('../../../service');
module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'activities'}, body);
        if (!data._id) {
            return {success: false, message: 'activities post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'activities', _id: data._id});

        return entry ? {success: true, data: {...entry, deletionIsAllowed: true}} : {success: false, message: 'activities post failed', errorStatus: 500}

    } catch (e) {
        console.log('activities err', e);
        return {success: false, message: 'activities failed', errorStatus: 500}
    }
}

const service = require('../../../service');
module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'organizations'}, body);
        if (!data._id) {
            return {success: false, message: 'organizations post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'organizations', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'organizations post failed', errorStatus: 500}

    } catch (e) {
        console.log('organizations err', e);
        return {success: false, message: 'organizations failed', errorStatus: 500}
    }
}

const service = require('../../../service');
module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingexternallinks'}, body);
        if (!data._id) {
            return {success: false, message: 'landingexternallinks post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingexternallinks', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingexternallinks post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingexternallinks err', e);
        return {success: false, message: 'landingexternallinks failed', errorStatus: 500}
    }
}

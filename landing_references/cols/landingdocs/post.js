const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingdocs'}, body);
        if (!data._id) {
            return {success: false, message: 'landingdocs post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingdocs', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingdocs post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingdocs err', e);
        return {success: false, message: 'landingdocs failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const { getObjId } = require('../../../utils');

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        const data = await service.save({collection: 'landingnews'}, body);
        if (!data._id) {
            return {success: false, message: 'landingnews post failed', errorStatus: 500}
        }
        const entry = await service.fetch({collection: 'landingnews', _id: data._id});

        return entry ? {success: true, data: entry} : {success: false, message: 'landingnews post failed', errorStatus: 500}

    } catch (e) {
        console.log('landingnews err', e);
        return {success: false, message: 'landingnews failed', errorStatus: 500}
    }
}

const service = require('../../../service');

module.exports = async (req) => {
    try {
        const list = await service.fetch({collection: 'contentmanagers', pipeline: [
            {$match: {
                deactivated: {$ne: true}
            }},
        ]});

        return {success: true, data: list}
    } catch (e) {
        console.log('contentmanagers ', e);
        return {success: false, message: 'contentmanagers list failed', errorStatus: 500}
    }
}

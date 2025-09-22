const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'contentmanagers', pipeline: [
            {$match: {_id: id}},
        ], asEntry: true});

        return {success: true, data: entry}

    } catch (e) {
        console.log('contentmanagers ', e);
        return {success: false, message: 'contentmanagers failed', errorStatus: 500}
    }
}

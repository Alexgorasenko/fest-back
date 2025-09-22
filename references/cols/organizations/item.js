const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const entry = await service.fetch({collection: 'organizations', _id: id});

        return {success: true, data: entry}

    } catch (e) {
        console.log('userflow get by inn', e);
        return {success: false, message: 'userflow check query failed', errorStatus: 500}
    }
}

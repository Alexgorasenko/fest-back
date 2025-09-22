const service = require('../../../service');
module.exports = async (req) => {
    try {
        const list = await service.fetch({collection: 'organizations'});

        return {success: true, data: list}

    } catch (e) {
        console.log('userflow get by inn', e);
        return {success: false, message: 'userflow check query failed', errorStatus: 500}
    }
}

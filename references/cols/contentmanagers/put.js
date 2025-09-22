const service = require('../../../service');

module.exports = async (req, id) => {
    try {
        const {_id,email, ...patch} = req.body;

        // if (patch.email) {
        //     const manager = await service.fetch({collection: 'contentmanagers', email: patch.email.trim(), asEntry: true);
        //
        //     if (manager) {
        //         return {success: false, message: 'Пользователь уже существует', errorStatus: 400}
        //     }
        // }
        const entry = await service.findOneAndUpdate({collection: 'contentmanagers', match: {_id: id}}, patch)

        return {success: true, data: entry}
    } catch (e) {
        console.log('contentmanagers put', e);
        return {success: false, message: 'contentmanagers put failed', errorStatus: 500}
    }
}

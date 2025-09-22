const service = require('../../../service');
const secret = "bridge"
module.exports = async (req, item) => {
    try {
        const { key, email } = req.query;
        if (!email || !key || key !== secret) {
            return {success: false, message: 'проверьте параметры', errorStatus: 401}
        }

        const entry = await service.fetch({collection: 'publicusers', pipeline: [
            {$match: {
                email: email
            }}
        ], asEntry: true});

        return {
            success: entry ? true : false,
            data: entry || null
        }

    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

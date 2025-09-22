const service = require('../../../service');
const path = require('path');

module.exports = async (req, item) => {
    try {
        if (!item) {
            return {success: false, message: 'check params', errorStatus: 400}
        }
        const attach = await service.fetch({collection: 'attachments', _id: item});

        if (!attach) {
            return {success: false, message: `вложение ${item} не найдено`, errorStatus: 400}
        }
        //return req.files
        return {success: true, file: attach.path}
    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'get file failed', errorStatus: 500}
    }
}

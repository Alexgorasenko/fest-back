const path = require('path');

module.exports = async (req, item) => {
    try {
        if (!item) {
            return {success: false, message: 'check params', errorStatus: 400}
        }

        return {success: true, file: `docs/${item}`}
    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'get file failed', errorStatus: 500}
    }
}

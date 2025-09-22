const service = require('../service');
const { getObjId, sampleReducer } = require('../utils')
const getFestFullData = require('./getFestFullData')

const moment = require('moment');

module.exports = async (match) => {
    try {

        if (match._id) {
            const festId = getObjId(match._id )

            if (!festId) {
                return {success: false, message: 'проверьте параметры', errorStatus: 400}
            }
            match._id = festId
        }
        const fest = await getFestFullData(match, true)

        return fest

    } catch (e) {
        console.log('get fest preload failed', e);
        return {success: false, message: 'get fest preload failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const { getFestPreloadData } = require('../../../modules')
const moment = require('moment');

module.exports = async (req, item) => {
    try {
        const now = moment().format('YYYY.MM.DD');
        const match = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        const festivalres = await getFestPreloadData(match)
        return festivalres

    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

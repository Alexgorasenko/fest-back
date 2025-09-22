const service = require('../../../service');
const { settings_pipeline } = require('../../../pipelines')
const { getFestFullData, getFestPreloadData } = require('../../../modules')
const outformat = 'YYYY.MM.DD'
const informat = 'DD.MM.YYYY'
const moment = require('moment');

module.exports = async (req, id) => {
    try {

        // const entry = await service.fetch({collection: 'festivals', pipeline: [
        //     {$match: {_id: id}},
        //     ...settings_pipeline
        // ]});
        const entry = await getFestFullData({_id: id})

        const dateStart = entry.dateStart && isCorrectFormat(entry.dateStart, outformat) ? moment(entry.dateStart, outformat).format(informat) : "";
        const dateEnd = entry.dateEnd && isCorrectFormat(entry.dateEnd, outformat) ? moment(entry.dateEnd, outformat).format(informat) : "";

        return {
            success: true,
            data: {
                ...entry,
                dateStart: dateStart,
                dateEnd: dateEnd
            }
        }


    } catch (e) {
        console.log('ref festivals', e);
        return {success: false, message: 'ref festivals failed', errorStatus: 500}
    }
}

const isCorrectFormat = (dateString, format) => {
    return moment(dateString, format, true).isValid()
}

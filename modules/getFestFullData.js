const service = require('../service');
const { getObjId, sampleReducer } = require('../utils')
const { festival_pipeline } = require('../pipelines')
const moment = require('moment');
const outformat = 'YYYY.MM.DD'
const informat = 'DD.MM.YYYY'

module.exports = async (match, preload=false) => {
    try {

        if (match._id) {
            const festId = getObjId(match._id )

            if (!festId) {
                return {success: false, message: 'проверьте параметры', errorStatus: 400}
            }
            match._id = festId
        }
        const fetsPipe = preload ? festival_pipeline.filter(p => !p['$lookup'] || p['$lookup'].from !== 'activities') : festival_pipeline;
        let fest = await service.fetch({collection: 'festivals', pipeline: [
            {$match: match},
            ...fetsPipe
        ], asEntry: true})

        if (!fest) {

            console.log('Активный фестиваль не найден')

            fest = await service.fetch({collection: 'festivals', pipeline: [
                {$match: {}},
                {$sort: {_id: -1}},
                {$limit: 1},
                ...fetsPipe
            ], asEntry: true})

            //return {success: false, message: 'фестиваль не найден', errorStatus: 400}
        }

        const dateStart = fest.dateStart && isCorrectFormat(fest.dateStart, outformat) ? moment(fest.dateStart, outformat).format(informat) : "";
        const dateEnd = fest.dateEnd && isCorrectFormat(fest.dateEnd, outformat) ? moment(fest.dateEnd, outformat).format(informat) : "";
        const {nominations, ...festData} = fest
        //return festsettings
        const mappedSettings = nominations.map((n) => {
            const {nominationtypes, countStudents, ...nomination} = n;

            let patchedData = {...nomination};
            const mapdTypes = []
            if (countStudents && countStudents.length) {
                const sorted =  countStudents.sort((a, b) => a - b);
                for (let i = 0; i < sorted.length; i++) {
                    const val = sorted[i];
                    const prev = sorted[i-1]

                    if (i === 0) {
                        mapdTypes.push({
                            "name": `менее ${val} учеников`,
                            "countStudents": {
                                "min": 0,
                                "max": val
                            }
                        })
                    }

                    if (prev && val) {
                        mapdTypes.push({
                            "name": `от ${prev} до ${val} учеников`,
                            "countStudents": {
                                "min": prev,
                                "max": val
                            }
                        })
                    }

                    if (i === sorted.length - 1) {
                        mapdTypes.push({
                            "name": `более ${val} учеников`,
                            "countStudents": {
                                "min": val,
                                "max": 10000000
                            }
                        })
                    }

                }
            }
            patchedData.nominationtypes = mapdTypes;
            return patchedData//{...setting, data: patchedData}
        })
        const merged = {...festData, dateStart: dateStart, dateEnd: dateEnd, nominations: mappedSettings.sort((a, b) => a.sort - b.sort)}

        return {success: true, data: merged}
    } catch (e) {
        console.log('get full fest failed', e);
        return {success: false, message: 'get full fest failed', errorStatus: 500}
    }
}

const isCorrectFormat = (dateString, format) => {
    return moment(dateString, format, true).isValid()
}

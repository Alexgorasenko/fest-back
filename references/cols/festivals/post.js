const service = require('../../../service');
const uploader_attach_s3 =  require('../../../uploader_attach_s3')
const validMimeTypes = ['jpg', 'jpeg', 'png', 'pdf']
const moment = require('moment');
const outformat = 'YYYY.MM.DD'
const informat = 'DD.MM.YYYY'

module.exports = async (req) => {
    try {
        const {_id, active, ...body} = req.body;
        const HOST = `https://s3.megafon.cloud/${process.env.FILES_BUCKET_ID}/`;
        if (req.files && req.files.logo) {

            const { logo } = req.files;
            const type = logo.mimetype.split('/')[1];

            if (!type || !validMimeTypes.includes(type)){
                return {success: false, msg: 'Неверный формат загружаемого файла', errorStatus: 400}
            }
            const filePathData = await uploader_attach_s3({file: logo, userFileName: logo.name, folder: 'storage'});

            if (!filePathData.success || !filePathData.data || !filePathData.data.path) {
                console.log('UPLOAD LOGO FAILED');
                return filePathData
            }
            // body.path = filePathData.data.path;
            // body.size = filePathData.data.size;
            // body.filename = body.filename ? body.filename : filePathData.data.filename;
            // body.localname = filePathData.data.localname;

            body.logo = HOST + filePathData.data.path;
        }

        if (!body.dateStart || !body.dateEnd) {
            return {success: false, message: 'dateStart or dateEnd not found, check params', errorStatus: 400}
        }

        if (!isCorrectFormat(body.dateStart, informat)) {
            return {success: false, message: 'некорректное значение dateStart', errorStatus: 400}
        }
        if (!isCorrectFormat(body.dateEnd, informat)) {
            return {success: false, message: 'некорректное значение dateEnd', errorStatus: 400}
        }

        body.dateStart = moment(req.body.dateStart, informat).format(outformat);
        body.dateEnd = moment(req.body.dateEnd, informat).format(outformat);

        const festivals =  await service.fetch({collection: 'festivals', pipeline: [
            {$match: {}},
            {$project: {_id: 1, dateStart: 1, dateEnd: 1}}
        ]})

        const festival = festivals.find(f => (body.dateEnd >= f.dateStart && body.dateEnd <= f.dateEnd) || (body.dateStart >= f.dateStart && body.dateStart <= f.dateEnd) || (!isGTE(body.dateStart, f.dateStart) && isGTE(body.dateEnd, f.dateEnd)))

        if (festival) {
            return {success: false, message: `найден фестиваль ${festival._id}с пересекающимися датами, dateStart: ${festival.dateStart}, dateEnd: ${festival.dateEnd}`, errorStatus: 400}
        }

        //гасим активные перед созданием нового
        // const currentActives = await service.fetch({collection: 'festivals', active: true})
        // for(let fest of currentActives) {
        //     await service.update({collection: 'festivals', _id: fest._id}, {active: false})
        // }

        const data = await service.save({collection: 'festivals'}, {...body});

        if (!data._id) {
            return {success: false, message: 'festival post failed', errorStatus: 500}
        }

        if (body.extraPointsFinishedVideo) {
            const actId = await createVideoAct(data._id, body.extraPointsFinishedVideo);
            if (!actId) {
                console.log('ACT NOT CREATE', data._id, body.extraPointsFinishedVideo);
            } else {
                patch.finishedVideoActivityId = actId
                await service.update({collection: 'festivals', _id: data._id}, {"finishedVideoActivityId": actId});
            }
        }

        const entry = await service.fetch({collection: 'festivals', _id: data._id});

        const dateStart = entry.dateStart && isCorrectFormat(entry.dateStart, outformat) ? moment(entry.dateStart, outformat).format(informat) : "";
        const dateEnd = entry.dateEnd && isCorrectFormat(entry.dateEnd, outformat) ? moment(entry.dateEnd, outformat).format(informat) : "";

        return entry ? {
            success: true,
            data: {
                ...entry,
                deletionIsAllowed: true,
                dateStart: dateStart,
                dateEnd: dateEnd,
            }} : {success: false, message: 'festival post failed', errorStatus: 500}

    } catch (e) {
        console.log('userflow get by inn', e);
        return {success: false, message: 'userflow check query failed', errorStatus: 500}
    }
}

const isCorrectFormat = (dateString, format) => {
    return moment(dateString, format, true).isValid()
}

const isGTE = (date1, date2) => {
    return moment(date1, outformat).isSameOrAfter(moment(date2, outformat)); // true
}

const createVideoAct = async (festivalId, pointsForСompletion) => {
    const actsCount = await service.count({collection: 'activities', festivalId: festivalId});

    const body = {
        "name": "Видеоролик о проведении фестиваля в организации (до 3 минут)",
        "desc": "",
        "sort": actsCount+1,
        "isExtra": true,
        "festivalId": festivalId,
        "participants": {
            "educationLevels": [],
            "nominations": [],
            "sex": "all"
        },
        "countingCriterias": [
            {
              "type": "video",
              "mandatory": false,
              "minItems": 1,
              "maxItems": 1,
              "max_time_sec": 60,
              "format": "horizontal",
              "reportDescription": "съемка видеоролика о проведении мероприятия фестиваля в организации",
              "label": "съемка видеоролика о проведении мероприятия фестиваля в организации",
              "mutedLabel": "(до 3 минут)",
              "pointsForEvery": 0,
              "pointsForСompletion": pointsForСompletion
            }
        ]
    }

    const data = await service.save({collection: 'activities'}, body);
    return data._id
}

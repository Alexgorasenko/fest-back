const service = require('../../../service');
const uploader_attach_s3 =  require('../../../uploader_attach_s3')
const validMimeTypes = ['jpg', 'jpeg', 'png', 'pdf']
const moment = require('moment');
const outformat = 'YYYY.MM.DD'
const informat = 'DD.MM.YYYY'

module.exports = async (req, id) => {
    try {
        const {_id, logo, active, ...patch} = req.body;
        const fest = await service.fetch({collection: 'festivals', _id: id})
        if (!fest) {
            return {success: false, message: `фестиваль не найден по ${id}`, errorStatus: 400}
        }
        if (patch.removeFestival) {
            const queriesCount = await service.count({collection: 'queries', festivalId: id});
            if (queriesCount) {
                return {success: false, message: `В фестивале ${queriesCount} заявок, удаление запрещено`, errorStatus: 400}
            }
            const res = await service.delete({collection: 'festivals', _id: id})
            return {success: true, data: res}
        }

        let start = null;
        let end = null;

        if (req.body.dateStart) {
            if (!isCorrectFormat(req.body.dateStart, informat)) {
                return {success: false, message: 'некорректное значение dateStart', errorStatus: 400}
            }
            start = moment(req.body.dateStart, informat).format(outformat);
            patch.dateStart = moment(req.body.dateStart, informat).format(outformat);
        }

        if (req.body.dateEnd) {
            if (!isCorrectFormat(req.body.dateEnd, informat)) {
                return {success: false, message: 'некорректное значение dateEnd', errorStatus: 400}
            }
            end = moment(req.body.dateEnd, informat).format(outformat);
            patch.dateEnd = moment(req.body.dateEnd, informat).format(outformat);
        }

        if (start || end) {
            if(!end) {
                end = fest.dateEnd
            }
            if(!start) {
                start = fest.dateStart
            }

            const festivals =  await service.fetch({collection: 'festivals', pipeline: [
                {$match: {
                    _id: {$ne: id}
                }},
                {$project: {_id: 1, dateStart: 1, dateEnd: 1}}
            ]})
console.log(end, start);
            const festival = festivals.find(f => (end >= f.dateStart && end <= f.dateEnd) || (start >= f.dateStart && start <= f.dateEnd) || (!isGTE(start, f.dateStart) && isGTE(end, f.dateEnd)))

            if (festival) {
                return {success: false, message: `найден фестиваль ${festival._id}с пересекающимися датами, dateStart: ${festival.dateStart}, dateEnd: ${festival.dateEnd}`, errorStatus: 400}
            }
        }
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

            //patch.logo = `${req.isProdFront ? 'https://fests.rfs.ru/' : 'https://preprod-fests.rfs.ru/'}` + filePathData.data.path;
            const HOST = `https://s3.megafon.cloud/${process.env.FILES_BUCKET_ID}/`;
            patch.logo = HOST + filePathData.data.path;
        }
        if (patch.extraPointsFinishedVideo && patch.extraPointsFinishedVideo !== fest.extraPointsFinishedVideo) {
            if (!fest.finishedVideoActivityId) {
                const actId = await createVideoAct(id, patch.extraPointsFinishedVideo);
                if (!actId) {
                    console.log('ACT NOT CREATE', id, patch.extraPointsFinishedVideo);
                } else {
                    patch.finishedVideoActivityId = actId
                }

            } else {
                const finishedVideoActivity = await service.fetch({collection: 'activities', _id: fest.finishedVideoActivityId})
                if (!finishedVideoActivity) {
                    const actId = await createVideoAct(id, patch.extraPointsFinishedVideo);
                    if (!actId) {
                        console.log('ACT NOT CREATE', id, patch.extraPointsFinishedVideo);
                    } else {
                        patch.finishedVideoActivityId = actId
                    }
                } else {
                    await service.update({collection: 'activities', _id: fest.finishedVideoActivityId}, {"countingCriterias": [
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
                          "pointsForСompletion": patch.extraPointsFinishedVideo
                        }
                    ]});
                }
            }
        }
        const entry = await service.findOneAndUpdate({collection: 'festivals', match: {_id: id}}, patch);
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

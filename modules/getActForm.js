const service = require('../service');
const { getObjId } = require('../utils')
const { settings_pipeline, festival_pipeline } = require('../pipelines')
const getFestPreloadData = require('./getFestPreloadData')
const moment = require('moment');

module.exports = async (match) => {
    try {
        const { _id, festivalId, queryId, activityId, nominationId } = match;

        const objId = getObjId(_id);

        const objfestivalIdId = getObjId(festivalId);
        const objqueryId = getObjId(queryId);
        const objactivityId = getObjId(activityId);
        const objnominationId = getObjId(nominationId);

        if (!objId && (!objqueryId || !objfestivalIdId || !objactivityId || !objnominationId)) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const festival = await getFestPreloadData({_id: objfestivalIdId})

        if (!festival) {
            return {success: false, message: 'активный фестиваль не найден', errorStatus: 400}
        }

        const query = await service.fetch({collection: 'queries', pipeline: [
            {$match: {_id: objqueryId}},
            {$project: {_id: 1, queryData: 1, nominations: 1}}
        ], asEntry: true})

        if (!query) {
            return {success: false, message: 'заявка не найдена', errorStatus: 400}
        }

        const act = await service.fetch({collection: 'activities', pipeline: [
            {$match: {
                _id: objactivityId
            }},
            {$lookup: {
                from: 'activityreports',
                let: {aid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$aid', '$activityId']},
                        queryId: query._id,
                        nominationId: objnominationId
                    }},
                ],
                as: 'report'
            }},
            {$set: {
                report: {'$arrayElemAt': ['$report', 0]},
            }}
        ], asEntry: true})

        if (!act) {
            return {success: false, message: 'отчет не найдена', errorStatus: 400}
        }
        const reportData = act.report ? act.report.reportData : null
        const outData = {
            "_id": act.report ? act.report._id : null,
            "activityId": act._id,
            "queryId": queryId,
            "nominationId": nominationId,
            "info": {
                "title": act.name,
                "description": act.desc,
                participants: act.participants
            }
        }
        const nom = festival.data.nominations.find(n => n._id && n._id.toString() === nominationId.toString());
        if (!nom) {
            return {success: false, message: `номинация ${nominationId} в фестивале не найдена`, errorStatus: 400}
        }
        const querynom = query.nominations.find(n => n._id && n.handle && n._id.toString() === nominationId.toString());
        if (!querynom) {
            return {success: false, message: `номинация ${nominationId} ${nom.name} в заявке не выбиралась`, errorStatus: 400}
        }

        const controls = [{
            "type": "date",
            "reportDataKey": "date",
            "label": "Дата последнего мероприятия",
            "mutedLabel": "(из всех возрастных категорий)",
            "value": act.report && act.report.date ? act.report.date : null
        }];

        for (let i=0; i<act.countingCriterias.length; i++)  {
            const crit = act.countingCriterias[i];

            const obj = {
                type: crit.type
            }
            switch (crit.type) {
                case "countStudents":
                    const columns = []
                    for (let j=0; j < querynom.levels.length; j++) {
                        const level = querynom.levels[j]
                        const mapLevel = {title: level.levelData.name}

                        const manCount = !(+level.man) ? 0 : +level.man
                        const womanCount = !(+level.woman) ? 0 : +level.woman

                        // const mandis = !manCount || act.participants.sex === 'woman'//!level.man || act.participants.sex === 'woman'
                        // const womandis = !(+level.woman) || act.participants.sex === 'man'//!level.woman || act.participants.sex === 'man'

                        const disAct = act.participants.sex === 'woman' ? !womanCount : act.participants.sex === 'woman' ? !manCount : !(manCount + womanCount)
/*//act.participants.sex === 'woman' ? "Согласно положению, в данном мероприятии  принимают участие только девочки" : act.participants.sex === 'я man' ?  "Согласно положению, в данном мероприятии  принимают участие только мальчики" : null,*/
                        const controls = [
                            // {
                            //     "type": "number",
                            //     "label": "Участвовало девочек",
                            //     "disabled": womandis, //наследуется из заявки или настроек activity
                            //     "disabledHint": null,
                            //     "mandatory": crit.mandatory, //наследуется из настроек activity
                            //     "reportDataKey": `criterias_${i}_girls_${level.levelData._id}`,
                            //     "value": reportData ? (reportData[`criterias_${i}_girls_${level.levelData._id}`] || null) : null
                            // },
                            {
                                "type": "number",
                                "label": crit.label,
                                "mutedLabel": crit.mutedLabel,
                                "disabled": disAct,
                                "disabledHint": disAct ? "Согласно поданной заявке данная категория обучающихся отсутствует" : "",
                                "mandatory": crit.mandatory,
                                "description": crit.description,
                                "reportDataKey": `criterias_${i}_students_${level.levelData._id}`,
                                "value": reportData ? (reportData[`criterias_${i}_students_${level.levelData._id}`] || null) : null
                            }
                        ]

                        mapLevel.controls = controls;
                        columns.push(mapLevel)
                    }
                    obj.columns = columns;
                    break;
                case 'countTeams':
                case 'pointsExtra':
                    controls.push({
                        ...obj,
                        "label": crit.label,
                        "mutedLabel": crit.mutedLabel,
                        "maxItems": crit.maxItems,
                        "minItems": crit.minItems,
                        "mandatory": crit.mandatory,
                        "reportDataKey": `criterias_${i}_qty`,
                        "description": crit.description,
                        "value": reportData ? (reportData[`criterias_${i}_qty`] || null) : null
                    })
                    continue;
                case "video":
                    if (crit.pointsForEvery) {
                        const columns = []
                        for (let j=0; j < querynom.levels.length; j++) {
                            const level = querynom.levels[j]

                            const mapLevel = {title: level.levelData.name}
                            // const mandis = !(+level.man) || act.participants.sex === 'woman'//!level.man || act.participants.sex === 'woman'
                            // const womandis = !(+level.woman) || act.participants.sex === 'man'//!level.woman || act.participants.sex === 'man'

                            const manCount = !(+level.man) ? 0 : +level.man
                            const womanCount = !(+level.woman) ? 0 : +level.woman

                            // const mandis = !manCount || act.participants.sex === 'woman'//!level.man || act.participants.sex === 'woman'
                            // const womandis = !(+level.woman) || act.participants.sex === 'man'//!level.woman || act.participants.sex === 'man'

                            const disAct = act.participants.sex === 'woman' ? !womanCount : act.participants.sex === 'woman' ? !manCount : !(manCount + womanCount)

                            const controls = [{
                                "type": "urls",
                                "label": crit.label,
                                "disabled": disAct, //наследуется из заявки или настроек activity
                                "disabledHint": disAct ? "Согласно поданной заявке данная категория обучающихся отсутствует" : null,
                                "mutedLabel": crit.mutedLabel,
                                "maxItems": crit.maxItems,
                                "minItems": crit.minItems,
                                "mandatory": crit.mandatory, //наследуется из настроек activity
                                "reportDataKey": `criterias_${i}_urls_${level.levelData._id}`,
                                "needCheckItemsForVideo": crit.needCheckItemsForVideo || null,
                                "value": reportData ? (reportData[`criterias_${i}_urls_${level.levelData._id}`] || []) : []
                            }]
                            mapLevel.controls = controls;
                            columns.push(mapLevel)
                        }
                        obj.columns = columns;
                    } else {
                        controls.push({
                            ...obj,
                            "label": crit.label,
                            "mutedLabel": crit.mutedLabel,
                            "maxItems": crit.maxItems,
                            "minItems": crit.minItems,
                            "mandatory": crit.mandatory,
                            "reportDataKey": `criterias_${i}_urls`,
                            "needCheckItemsForVideo": crit.needCheckItemsForVideo || null,
                            "description": crit.description,
                            "value": reportData ? (reportData[`criterias_${i}_urls`] || []) : []
                        })
                        continue
                    }
                    break;
                case 'photo':
                case 'publication':
                    controls.push({
                        ...obj,
                        "label": crit.label,
                        "mutedLabel": crit.mutedLabel,
                        "maxItems": crit.maxItems,
                        "minItems": crit.minItems,
                        "mandatory": crit.mandatory,
                        "reportDataKey": `criterias_${i}_urls`,
                        "description": crit.description,
                        "value": reportData ? (reportData[`criterias_${i}_urls`] || []) : []
                    })
                    continue
            }
            controls.push(obj)
        }

        // if (act.report) {
        //     return {
        //         ...outData,
        //         "_id": act.report._id,
        //         "controls": controlsact.report.reportData
        //     }
        // } else {
        //
        // }
        return {
            ...outData,
            "controls":controls
        }
    //return act
    } catch (e) {
        console.log('mod getActForm failed', e);
        return {success: false, message: 'mod getActForm failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { festival_pipeline, query_pipeline } = require('../../../pipelines')
const {getFestPreloadData} = require('../../../modules')
const moment = require('moment')

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid)
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const { festivalId } = req.body;
        const festivalObjId = getObjId(festivalId)
        if (!festivalObjId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const now = moment().format('YYYY.MM.DD')
        const matchFest = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        const festivalres = await getFestPreloadData({
            _id: festivalObjId,
            ...matchFest
        })
        if (!festivalres || festivalres.errorStatus) {
            return festivalres
        }
        const festival = festivalres.data;

        if (!festival) {
            return {success: false, message: 'фестиваль не активен', errorStatus: 400}
        }
        if (!festival.nominations || !festival.nominations.length) {
            return {success: false, message: 'в фестивале не заполнены номинации', errorStatus: 500}
        }

        const festnoms = festival.nominations.reduce((acc, cur) => {
            if (!acc[cur._id]) {
                acc[cur._id] = cur;
            }
            return acc
        }, {});


        let query = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                userId: userId,
                festivalId: festivalObjId,
                archived: false
            }},
            ...query_pipeline
        ], asEntry: true})

        if (!query){
            const queryBody = {
                status: "DRAFT",
                userId: userId,
                festivalId: festivalObjId,
                nominations: festival.nominations.map(nom => ({
                    _id: getObjId(nom._id),
                    handle: false,
                    levels: nom.educationLevels && nom.educationLevels.length ? nom.educationLevels.map(l => ({
                        _id: getObjId(l._id),
                        man: 0,
                        woman: 0
                    })) : []
                }))
            }

            query = await service.save({collection: 'queries'}, queryBody)
            if (!query._id) {
                query = await service.save({collection: 'queries'}, queryBody)
            }
            if (query._id) {
                query = await service.fetch({collection: 'queries', pipeline: [
                    {$match: {
                        _id: query._id
                    }},
                    ...query_pipeline
                ], asEntry: true})
            } else {
                return {success: false, message: 'userflow create_draft failed', errorStatus: 500}
            }
        }

        const noms = query.nominations && query.nominations.length ? query.nominations.map(cur => {
            if (!festnoms[cur._id]) {
                return cur
            }

            const {nominationtypes, educationLevels, ...nom} = festnoms[cur._id];

            //const nominationtype = cur.nominationtypeId ? nominationtypes.find(t => t._id && t._id.toString() === cur.nominationtypeId.toString()): null;

            const maped = {
                ...cur,
                ...nom,
                //nominationtype: nominationtype,
                levels: cur.levels.map(l => {
                    const levelData = educationLevels.find(edlevel => edlevel._id && l._id && edlevel._id.toString() === l._id.toString());

                    if (levelData.option_description) {
                        levelData.name += ` (${levelData.option_description})`
                    }
                    return {
                    ...l,
                    levelData: levelData
                }})
            }
            return maped
        }) : []

        const mergedQuery = {...query, nominations: noms, festival: festival}
        return {
            success: true,
            data: mergedQuery
        }

    } catch (e) {
        console.log('userflow create_draft failed', e);
        return {success: false, message: 'userflow create_draft failed', errorStatus: 500}
    }
}

const getFullQueryData = async (queryId) => {

}

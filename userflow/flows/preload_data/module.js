const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { query_pipeline, festival_pipeline } = require('../../../pipelines')
const { getFestPreloadData } = require('../../../modules')
const moment = require('moment')

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const now = moment().format('YYYY.MM.DD')
        const matchFest = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        const festivalres = await getFestPreloadData(matchFest)
        if (!festivalres || festivalres.errorStatus) {
            return festivalres
        }

        const festival = festivalres.data;
        if (!festival) {
            return {success: false, message: 'Активный фестиваль не найден', errorStatus: 400}
        }

        const festnoms = festival.nominations.reduce((acc, cur) => {
            if (!acc[cur._id]) {
                acc[cur._id] = cur;
            }
            return acc
        }, {});

        const query = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                userId: userId,
                archived: false,
                festivalId: festival._id
            }},
            ...query_pipeline
        ], asEntry: true})

        if (!query) {
            return {
                success: true,
                data: {
                    festival: festival,
                    query: null,
                }
            }
        }
        const noms = query.nominations && query.nominations.length ? query.nominations.map(cur => {
            if (!festnoms[cur._id]) {
                return cur
            }

            const {nominationtypes, educationLevels, ...nom} = festnoms[cur._id];

            // const nominationtype = cur.nominationtypeId ? nominationtypes.find(t => t._id && t._id.toString() === cur.nominationtypeId.toString()): null;

            const maped = {
                ...cur,
                ...nom,
                //nominationtype: nominationtype,
                levels: cur.levels.map(l => {
                    const levelData = educationLevels.find(edlevel => edlevel._id && l._id && edlevel._id.toString() === l._id.toString());
                    if (!levelData) {
                        return null
                    }
                    if (levelData.option_description) {
                        levelData.name += ` (${levelData.option_description})`
                    }
                    return {
                    ...l,
                    levelData: levelData
                }}).filter(l => !!l)
            }
            return maped
        }) : []

        const mergedQuery = {...query, nominations: noms, festival: festival}

        return {
            success: true,
            data: {
                festival: festival,
                query: mergedQuery
            }
        }

    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

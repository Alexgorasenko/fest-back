const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { getQueryData, getFestPreloadData } = require('../../../modules');
const moment = require('moment');

module.exports = async (req, item) => {
    try {
        const now = moment().format('DD.MM.YYYY')
        const userObjId = getObjId(req.signer.uid)
        const queryId = getObjId(item)

        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }
        const { pdf } = req.query;

        const queryResp = await getQueryData(queryId)

        if (!queryResp || queryResp.success === false) {
            return queryResp
        }
        const query = queryResp.data;

        const festivalres = await getFestPreloadData({
            _id: query.festivalId
        })
        const festival = festivalres.data;

        if (!festival) {
            return {success: false, message: 'фестиваль не найден', errorStatus: 400}
        }

        const { nominations } = query;

        const festnoms = festival.nominations.reduce((acc, cur) => {
            if (!acc[cur._id]) {
                acc[cur._id] = cur;
            }
            return acc
        }, {});

        const queryTitle = festival.descriptionForQuery;

        let countHandled = 0;
        let nomsTitles = [];
        const students = {
            man: 0,
            woman: 0,
            all: 0
        };
        const mapdLevels = []
        for (let cur of query.nominations) {
            if (cur.handle) {
                countHandled += 1;

                const {nominationtypes, educationLevels, ...nom} = festnoms[cur._id];
                //const nominationtype = cur.nominationtypeId ? nominationtypes.find(t => t._id && t._id.toString() === cur.nominationtypeId.toString()): null;
                let nomsTitle = nom.name;
                if (cur.nominationtype) {
                    nomsTitle += ` (${cur.nominationtype.name})`
                }
                nomsTitles.push(nomsTitle)
                for (let level of cur.levels) {
                    const mapdlevels = {};

                    const levelData = educationLevels.find(edlevel => edlevel._id && level._id && edlevel._id.toString() === level._id.toString());
                    if (!levelData) {
                        return {success: false, msg: 'не найден уровень образования в заявке ' + level._id}
                    }

                    students.man += level.man
                    students.woman += level.woman
                    students.all += level.man + level.woman;

                    mapdlevels.name = levelData.name;
                    if (levelData.option_description) {
                        mapdlevels.name += ` (${levelData.option_description})`
                    }
                    mapdlevels.students = `${level.man + level.woman} (${level.woman}/${level.man})`
                    mapdLevels.push(mapdlevels)

                }
            } else {
                for (let level of cur.levels) {
                    const mapdlevels = {};

                    const levelData = educationLevels.find(edlevel => edlevel._id && edlevel._id.toString() === level._id.toString());
                    if (!levelData) {
                        return {success: false, msg: 'не найден уровень образования в заявке ' + level._id}
                    }

                    mapdlevels.name = levelData.name;
                    if (levelData.option_description) {
                        mapdlevels.name += ` (${levelData.option_description})`
                    }
                    mapdlevels.students = `0 (0/0)`
                    mapdLevels.push(mapdlevels)
                }
            }
        }
        if (!countHandled) {
            return {success: false, msg: 'в заявке нет выбранных номинаций'}
        }
        const querySubTitle = countHandled > 1 ? 'в номинациях: ' : 'в номинации - '

        const outData = {
            date: now,
            queryTitle: queryTitle,
            querySubTitle: querySubTitle + nomsTitles.join(', '),
            queryData: query.queryData,
            region: query.region,
            site: query.organizationQueryData.site,
            phone: query.organizationQueryData.phone,
            email: query.organizationQueryData.email,
            address: query.organizationQueryData.address.display,
            levels: mapdLevels,
            requisites: {
                inn: query.organizationQueryData.inn,
                kpp: query.organizationQueryData.kpp,
                ogrn: query.organizationQueryData.ogrn
            },
            organizationName: query.organizationQueryData.name,
            organizationFullName: query.organizationQueryData.fullName,
            students: students,
            director: query.director,
            contactPerson: query.contactPerson,
        }
        return {success: true, data: outData}
    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

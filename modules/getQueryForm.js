const service = require('../service');
const { getObjId, isEmptyOrNull } = require('../utils')
const getQueryData = require('./getQueryData');
const getFestPreloadData = require('./getFestPreloadData');

const moment = require('moment');

module.exports = async (item) => {
    try {
        const now = moment().format('YYYY.MM.DD')
        const queryId = getObjId(item)

        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const queryResp = await getQueryData(queryId)

        if (!queryResp || queryResp.success === false) {
            return queryResp
        }
        const query = queryResp.data;

        const festivalres = await getFestPreloadData({_id: query.festivalId});

        if (!festivalres || festivalres.errorStatus) {
            return festivalres
        }

        const festival = festivalres.data;
        if (!festival) {
            return {success: false, message: 'фестиваль не найден', errorStatus: 400}
        }

        const { nominations, organizationQueryData } = query;

        if (!organizationQueryData) {
            return {success: false, msg: 'в заявке не найдена организация', errorStatus: 400}
        }

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
        }
        const mapdLevels = []
        for (let cur of query.nominations) {
            const {nominationtypes, educationLevels, ...nom} = festnoms[cur._id];

            if (cur.handle) {
                countHandled += 1;

                //const nominationtype = cur.nominationtypeId && nominationtypes && nominationtypes.length && nominationtypes.length > 1 ? nominationtypes.find(t => t._id && t._id.toString() === cur.nominationtypeId.toString()): null;
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

                    students.man += getCountFromStr(level.man)
                    students.woman += getCountFromStr(level.woman)
                    students.all += getCountFromStr(level.man) + getCountFromStr(level.woman);

                    mapdlevels.name = levelData.name;
                    if (levelData.option_description) {
                        mapdlevels.name += ` (${levelData.option_description})`
                    }
                    mapdlevels.students = `${getCountFromStr(level.man) + getCountFromStr(level.woman)} (${getCountFromStr(level.woman)}/${getCountFromStr(level.man)})`
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
            region: query.region ? query.region : (organizationQueryData && organizationQueryData.address ? organizationQueryData.address.region : null),
            site: organizationQueryData.site,
            phone: !!organizationQueryData.phone ? organizationQueryData.phone :  query.director ? query.director.phone : null,
            email: !!organizationQueryData.email ? organizationQueryData.email :  query.director ? query.director.email : null,
            address: organizationQueryData.address.display,
            levels: mapdLevels,
            requisites: {
                inn: organizationQueryData.inn,
                kpp: organizationQueryData.kpp,
                ogrn: organizationQueryData.ogrn
            },
            organizationName: organizationQueryData.name,
            organizationFullName: organizationQueryData.fullName,
            students: students,
            director: query.director ? query.director.fullname : 'Руководитель не указан',
            contactPerson: query.contactPerson || null,
        }
        return {success: true, data: outData}
    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

const getCountFromStr = str => {
    return isNaN(+str) ? 0 : +str;
}

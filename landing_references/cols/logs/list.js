const service = require('../../../service');
const { getObjId } = require('../../../utils');
const moment = require('moment')

module.exports = async (req) => {
    try {
        const filter = {};

        const now = moment().format('YYYY.MM.DD')
        const matchFest = {$or: [{
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }, {}]}

        const festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: matchFest},
            {$sort: {_id: -1}},
            {$project: {_id: 1}}
        ], asEntry: true})

        if (!festival) {
            return {success: false, message: 'активный фестиваль не найден'}
        }

        const { dateStart=moment().subtract(7, 'days').format('YYYY-MM-DD'), dateEnd=moment().format('YYYY-MM-DD'), action, email, limit=100, page=0 } = req.query;

        if (dateStart) {
            if (!isCorrectFormat(dateStart)) {
                return {success: false, msg: 'некорректное значение dateStart'}
            }
            startIn = moment(dateStart, 'YYYY-MM-DD').utc(true).set({'hour': 0, 'minute':0, 'second': 0,'millisecond':0});
            filter.createdAt = {$gte: startIn.toDate()}
        }

        if (dateEnd) {
            if (!isCorrectFormat(dateEnd)) {
                return {success: false, msg: 'некорректное значение dateEnd'}
            }
            endIn = moment(dateEnd, 'YYYY-MM-DD').utc(true).set({'hour': 23, 'minute':59, 'second': 59,'millisecond':0})
            if (filter.createdAt) {
                filter.createdAt['$lte'] = endIn.toDate()
            } else {
                filter.createdAt = {$lte: endIn.toDate()}
            }
        }

        if (email) {
            filter.autor = {$regex: email, $options: 'i'}
        }

        if (action) {
            filter.action = action
        }

        const pipeDef = [{$match: filter}, {$sort: {_id: -1}}]

        const outData = {}

        if (limit && !isNaN(+limit) && +limit) {
            pipeDef.push(
                {$skip: page * limit},
                {$limit: +limit}
            )

            const listCount = await service.count({collection: 'loggers', pipeline: [
                {$match: filter},
            ]})

            const totalPages = Math.ceil(listCount / +limit)

            outData.count = listCount;
            outData.totalPages = totalPages;
            outData.currentPage = +page + 1;
        }

        const list = await service.fetch({collection: 'loggers', pipeline: [
            ...pipeDef,
        ]});
        const mappedLogs = await logsMapper(list);
        return {success: true, data: mappedLogs, ...outData}

    } catch (e) {
        console.log('loggers ', e);
        return {success: false, message: 'loggers list failed', errorStatus: 500}
    }
}


const logsMapper = async logs => {
    const maped = [];
    let ind = 0;
    for (let l of logs) {


        let patch = []
        if (l.action === 'put' && l.patch) {
            for (let key in l.patch) {
                if (!['password', 'token', 'recovery'].includes(key)) {
                    const value = l.patch[key];
                    const valueStr = value ? value.toString() : '';
                    //${Object.keys(value).length}
                    //console.log(typeof(value), value, value.toString());
                    patch.push({key: key, value: valueStr.includes('object') ? `изменилась подструктура документа` : valueStr})
                }
            }
            const objData = await getData(l);
            if (l.collectionName === 'queries' && ind < 5) {
                console.log('objData', objData);
            }
            if (objData) {
                const {email, desc, user, _id, name, ...outData} = objData
                l.email = email;
                l.name = name || cols[l.collectionName] || l.collectionName;
                //l.data = outData;
                l.desc = desc;
            } else {
                l.email = '';
                l.name = cols[l.collectionName] || l.collectionName;
                //l.data = outData;
                l.desc = "";
            }
        }

        let action = `${(actions[l.action] || l.action)} в коллекции ${(cols[l.collectionName] || l.collectionName)} ${l.id ? `(${l.id})` : ''} записи автора ${l.author || ''}`;

        if (l.collectionName === 'queries'  && ind < 5 ) {
            console.log('logout', l);
            ind += 1;
        }

        maped.push({
            email: l.email,
            name: l.name,
            data: l.data,
            desc: l.desc,
            type: l.action,
            author: l.author || '',
            authorCollection: l.authorCollection === 'publicusers' ? 'публичный пользователь' : 'супервайзер',
            action: action,
            logAction: l.action,
            logPatch: l.patch || null,
            collectionName: l.collectionName,
            createdAt: l.createdAt,
            date: moment(l.createdAt).utc(false).format('YYYY-MM-DD'),
            patch: patch
        })
    }
    return maped
}

const actions = {
    post: 'создание',
    put: 'изменение',
    delete: 'удаление',
}

const cols = {
    queries: 'заявки',
    publicdocs: 'документов',
    publicusers: 'пользователи',
    activityreports: 'отчеты в мероприятие',
    activities: 'мероприятия',
    supervisors: 'супервайзера',
    festivals: 'фестивали',
    educationlevels: 'уровни образования',
    nominations: 'номинации',
}

const isCorrectFormat = (dateString) => {
    return moment(dateString, "YYYY-MM-DD", true).isValid()
}



const getData = async log => {
    const id = getObjId(log.id)
    const col = log.collectionName;
    if (!id) {
        return null
    }

    const lookups = getLookup(col)
    const data = await service.fetch({collection: col, pipeline: [
        {$match: {
            _id: id
        }},
        ...lookups,
    ], asEntry: true});
    if (!data) {
        return null
    }
    return dataMapper(data, col)
}


const dataMapper = (d, col) => {

    let desc = '';
    let mapedData = d;
    switch (col) {
        case 'queries':
            mapedData.email = d.user ? d.user.email : ''
            break;
        case 'activityreports':
            desc = d.activity ? d.nomination ? `${d.activity.name} (${d.nomination.name})` : `${d.activity.name}` : ''
            mapedData.email = d.user ? d.user.email : ''
            break;
        // case 'activityreports':
        //     desc = d.activity ? d.nomination ? `${d.activity.name} (${d.nomination.name})` : `${d.activity.name}` : ''
        //     mapedData.email = d.user ? d.user.email : ''
        //     break;
        default:
            break;
    }
    return {desc: desc, ...mapedData}
}

const getLookup = col => {
    const lookups = {
        queries: [
            {$lookup: {
                from: 'publicusers',
                let: {uid: '$userId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$_id', '$$uid']}
                    }},
                    {$project: {email: 1}}
                ],
                as: 'user'
            }},
            {$set: {
                user: {'$arrayElemAt': ['$user', 0]}
            }},
            {$project: {
                user: 1
            }}
        ],
        publicdocs: [

        ],
        publicusers: [
            {$project: {email: 1}}
        ],
        activityreports: [
            {$lookup: {
                from: 'publicusers',
                let: {uid: '$userId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$_id', '$$uid']}
                    }},
                    {$project: {email: 1}}
                ],
                as: 'user'
            }},
            {$lookup: {
                from: 'activities',
                let: {aid: '$activityId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$_id', '$$aid']}
                    }},
                    {$project: {name: 1}}
                ],
                as: 'activity'
            }},
            {$lookup: {
                from: 'nominations',
                let: {nid: '$nominationId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$_id', '$$nid']}
                    }},
                    {$project: {name: 1}}
                ],
                as: 'nomination'
            }},
            {$set: {
                user: {'$arrayElemAt': ['$user', 0]},
                activity: {'$arrayElemAt': ['$activity', 0]},
                nomination: {'$arrayElemAt': ['$nomination', 0]},
            }}
        ],
        activities: [
            {$project: {name: 1}}
        ],
        supervisors: [
            {$project: {name: 1}}
        ],
        festivals: [
            {$project: {name: '$title'}}
        ],
        educationlevels: [
            {$project: {name: 1}}
        ],
        nominations: [
            {$project: {name: 1}}
        ],

    }
    return lookups[col] || []
}

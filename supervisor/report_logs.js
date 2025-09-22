const moment = require('moment')
const service = require('../service')
const xlsx = require('xlsx');

module.exports = async (req, res) => {
    const { rfu_admin, superadmin } = req.roles
    const { dateStart=moment().subtract(7, 'days').format('YYYY-MM-DD'), dateEnd=moment().format('YYYY-MM-DD'), action, email } = req.query

    if(rfu_admin || superadmin) {
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
            res.status(400).json({success: false, message: 'активный фестиваль не найден'})
            return {}
        }

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

        const headersTable = [
            "Дата",
            "Пользователь",
            "Событие",
            "Данные события",
        ];

        const list = await service.fetch({collection: 'loggers', pipeline: [
            {$match: filter},
            {$sort: {_id: -1}}
        ]});

        const mapped = logsMapper(list);
        const output = [headersTable, ...mapped];

        const workSheet = xlsx.utils.aoa_to_sheet(output);
        const workBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');

        const out = xlsx.write(workBook, {type:'base64', bookType: 'xlsx'});

        res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=*'+"Report"+'*.xlsx'
        });
        res.end(new Buffer(out, 'base64'));

    } else {
        res.status(403).json({success: false, message: 'Invalid role'})
    }
}

const logsMapper = logs => {
    return logs.map(l => {
        let patch = ''
        if (l.action === 'put' && l.patch) {
            let text = ''
            let count = 0;
            for (let key in l.patch) {
                if (!['password', 'token', 'recovery'].includes(key)) {
                    count += 1;
                    text += key + ';'
                }
            }
            if (count) {
                patch += (count > 1 ? 'изменились поля: ' : 'изменилось поле: ') + text;
            }

        }
        let action = `${(actions[l.action] || l.action)} ${( l.id || '')} в коллекции ${(cols[l.collectionName] || l.collectionName)}`;

        const author = l.author || '';
        const authorCollection = l.authorCollection === 'publicusers' ? 'публичный пользователь' : 'супервайзер';
        const createdAt = l.createdAt;
        const date = moment(l.createdAt).utc(false).format('YYYY-MM-DD');

        return [
            date,
            `${author} (${authorCollection})`,
            action,
            patch
        ]
    })
}

const actions = {
    post: 'создал запись',
    put: 'корректировка записи',
    delete: 'удалил запись',
}

const cols = {
    queries: 'заявки',
    publicdocs: 'документов',
    publicusers: 'пользователи',
    activityreports: 'отчеты в мероприятие',
    activities: 'мероприятия',
    supervisors: 'суервайзера',
    festivals: 'фестивали',
    educationlevels: 'уровни образования',
    nominations: 'номинации',
    landingdocs:"документов",
    landingexternallinks:"внешних ссылок",
    landingfeedbacks:"обратной связи",
    landingfirstpage:"главной страницы",
    landinghistories:"истории фестивалей",
    landingmedias:"медиа",
    landingnews:"новостей",
    landingpagepartners:"партнеров и спонсоров",
    landingpartners:"партнеров",
    landingprizes:"призов",
    landingpublications:"публикаций",
    landingstages:"стадий фестиваля",
    landingwinners:"победителей фестиваля"
}

const isCorrectFormat = (dateString) => {
    return moment(dateString, "YYYY-MM-DD", true).isValid()
}

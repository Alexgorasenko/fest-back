const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = async (req, res) => {
    const { id } = req.params
    const { superadmin, moderator, rfu_admin } = req.roles

    if(!id || id.length !== 24) {
        res.status(400).json({success: false, message: 'Invalid id provided'})
    } else {
        if(superadmin || rfu_admin || moderator) {
            const raw = await service.fetch({
                collection: 'queries',
                pipeline: [
                    {$match: {
                        _id: new ObjectId(id)
                    }},
                    {$lookup: {
                        from: 'attachments',
                        localField: '_id',
                        foreignField: 'sampleId',
                        as: 'attachments'
                    }},
                    {$lookup: {
                        from: 'organizations',
                        let: {oid: '$organizationId'},
                        pipeline: [
                            {$match: {$expr: {$eq: ['$$oid', '$_id']}}},
                        ],
                        as: 'organization'
                    }},
                    {$lookup: {
                        from: 'attachments',
                        localField: 'attachmentFormId',
                        foreignField: '_id',
                        as: 'attachment'
                    }},
                    {$set: {
                        organization: {'$arrayElemAt': ['$organization', 0]},
                        attachment: {'$arrayElemAt': ['$attachment', 0]},
                    }}
                ],
                asEntry: true
            })

            if(!raw) {
                res.status(404).json({success: false, message: 'Application not found'})
            } else {
                const formatted = await formatQuery(raw)
                res.json(formatted)
            }
        } else {
            res.status(403).json({success: false, message: 'Invalid role'})
        }
    }
}

const formatQuery = async query => {
    const { address, name, fullName, inn, kpp, ogrn, site } = query.organizationQueryData
    const { status, deliveryToModerated, nominations, director = {}, contactPerson = {}, moderatorData } = query

    for(let nom of nominations) {
        const nomEntry = await service.fetch({collection: 'nominations', _id: nom._id})
        nom.name = nomEntry ? nomEntry.name : 'Номинация без названия'
        nom.description = nomEntry ? nomEntry.description : null
        for(let level of nom.levels) {
            const levEntry = await service.fetch({collection: 'educationlevels', _id: level._id})
            level.name = levEntry ? levEntry.name : 'Уровень без названия'
        }
    }

    return {
        meta: {
            datetime: deliveryToModerated,
            status: status,
            moderatorData: moderatorData
        },
        checklist: [
            {
                rootLabel: 'Данные организации',
                list: [
                    {label: 'Субъект РФ', value: address.region.name},
                    {label: 'Полное наименование организации', value: fullName},
                    {label: 'Почтовый адрес', value: address.display},
                    {label: 'Официальный сайт', value: site},
                    {label: 'ИНН организации', value: inn},
                    {label: 'КПП организации', value: kpp},
                    {label: 'ОГРН организации', value: ogrn}
                ]
            },
            {
                rootLabel: 'Количество обучающихся',
                list: nominations.map(nom => (
                    {
                        label: nom.name,
                        strong: nom.description !== null,
                        sub: nom.description,
                        values: nom.levels.map(l => ({
                            sectionLabel: nom.description !== null ? null : l.name,
                            list: [
                                {label: 'Девочки', value: l.woman},
                                {label: 'Мальчики', value: l.man}
                            ]
                        }))
                    }
                ))
            },
            {
                rootLabel: 'Руководитель учреждения',
                list: [
                    {label: 'ФИО', value: director ? director.fullname : ''},
                    {label: 'Должность', value: director ? director.post : ''},
                    {label: 'Телефон', value: director ? director.phone : ''},
                    {label: 'Почта', value: director ? director.email : ''}
                ]
            },
            {
                rootLabel: 'Лицо, ответственное за проведение фестиваля',
                list: [
                    {label: 'ФИО', value: contactPerson ? contactPerson.fullname : ''},
                    {label: 'Должность', value: contactPerson ? contactPerson.post : ''},
                    {label: 'Телефон', value: contactPerson ? contactPerson.phone : ''},
                    {label: 'Почта', value: contactPerson ? contactPerson.email : ''}
                ]
            }
        ],
        attachment: query.attachment || null,
        attachmentFormId: query.attachmentFormId,
        attachments: query.attachments,
        organization: query.organization || null
    }
}

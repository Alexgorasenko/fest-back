const service = require('../../../service')
const moment = require('moment');

module.exports = async (req) => {

    try {
        const now = moment().format('YYYY.MM.DD');
        const match = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        let fest = await service.fetch({collection: 'festivals', pipeline: [
            {$match: match},
            {$project: {_id: 1, logo: 1}}
        ], asEntry: true})

        if (!fest) {
            //return {success: false, message: 'Активный фестиваль не найден', errorStatus: 400}
            console.log('Активный фестиваль не найден')
            fest = await service.fetch({collection: 'festivals', pipeline: [
                {$match: {}},
                {$project: {_id: 1, logo: 1}},
                {$sort: {_id: -1}},
                {$limit: 1}
            ], asEntry: true})
        }

        const filter = {
            $or: [{isVisible: true}, {isVisible: {$exists: false}}]
        }

        const docs = await service.fetch({collection: 'landingdocs', pipeline: [
            {$match: {}},
        ], asEntry: true});

        const externalLinks = await service.fetch({collection: 'landingexternallinks', pipeline: [
            {$match: {}},
            {$lookup: {
                from: 'attachments',
                localField: 'file.fileId',
                foreignField: '_id',
                as: 'fileData'
            }},
            {$set: {
                fileData: {'$arrayElemAt': ['$fileData', 0]},
            }}
        ], asEntry: true});

        const feedback = await service.fetch({collection: 'landingfeedbacks', pipeline: [
            {$match: {}},
            {$lookup: {
                from: 'attachments',
                localField: 'policy.policyFileId',
                foreignField: '_id',
                as: 'policyFile'
            }},
            {$lookup: {
                from: 'attachments',
                localField: 'persData.persDataFileId',
                foreignField: '_id',
                as: 'persDataFile'
            }},
            {$set: {
                policyFile: {'$arrayElemAt': ['$policyFile', 0]},
                persDataFile: {'$arrayElemAt': ['$persDataFile', 0]},
            }}
        ], asEntry: true});

        const firstpage = await service.fetch({collection: 'landingfirstpages', pipeline: [
            {$match: {}},
        ], asEntry: true});

        const history = await service.fetch({collection: 'landinghistories', pipeline: [
            {$match: {}},
        ], asEntry: true});

        const mediaObj = await service.fetch({collection: 'landingmedias', pipeline: [
            {$match: filter},
        ], asEntry: true});

        const {media: gallery=[],  ...mediaInfo} = mediaObj

        const news = await service.fetch({collection: 'landingnews', pipeline: [
            {$match: {}},
        ], asEntry: true});

        const participants = await service.fetch({collection: 'landingparticipants', pipeline: [
            {$match: {}}
        ], asEntry: true});

        const { numbers, childrenParticipiedQty, totalReported, queriesCount, ...participantsData } = participants;

        if (participants && !participants.isManualEnter) {

            participantsData.numbers = {
                block_1: {
                    num: childrenParticipiedQty || 0,
                    text: numbers && numbers.block_1 ? participants.numbers.block_1.text : 'Количество участников мероприятий'
                },
                block_2: {
                    num: totalReported,
                    text: numbers && numbers.block_2 ? participants.numbers.block_2.text : 'Количество проведенных мероприятий'
                },
                block_3: {
                    num: queriesCount,
                    text: numbers && numbers.block_3 ? participants.numbers.block_3.text : 'Количество образовательных организаций, принимающих участие в фестивале'
                }
            }

        }

        const pagePartners = await service.fetch({collection: 'landingpagepartners', pipeline: [
            {$match: {}},
        ], asEntry: true});

        const partners = await service.fetch({collection: 'landingpartners', pipeline: [
            {$match: filter},
        ]});

        const prizeObj = await service.fetch({collection: 'landingprizes', pipeline: [
            {$match: filter},
        ], asEntry: true});

        // const publicationsCount = await service.count({collection: 'landingpublications', pipeline: [
        //     {$match: filter},
        // ]})

        const publications = await service.fetch({collection: 'landingpublications', pipeline: [
            {$match: {}},
            //{$sort: {isPinned: -1}},
        ]});

        const stagesObj = await service.fetch({collection: 'landingstages', pipeline: [
            {$match: {}},
        ], asEntry: true});

        const {stages=[], ...stageInfo} = stagesObj;

        const winnersObj = await service.fetch({collection: 'landingwinners', pipeline: [
            {$match: {}},
            {$lookup: {
                from: 'attachments',
                let: {fid: '$fileId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$_id', '$$fid']}
                    }},
                ],
                as: 'winnersListFile'
            }},
            {$set: {
                winnersListFile: {'$arrayElemAt': ['$winnersListFile', 0]},
            }}
        ], asEntry: true});

        const feedOut = feedback || {}
        if (externalLinks) {
            feedOut.socials = externalLinks
        }

        const outObj = {
            header: {
                socials: externalLinks || {},
                logo: fest ? fest.logo : "",
                menuLeft: [
                    {
                        id: 'contextBlock',
                        title: firstpage && firstpage.menuTitle ? firstpage.menuTitle : 'О фестивале'
                    },
                    {
                        id: 'participants',
                        title: participantsData.menuTitle || 'Участники'
                    },
                    {
                        id: 'stages',
                        title: stageInfo.menuTitle || 'Этапы'
                    },
                    {
                        id: 'gallery',
                        title: mediaInfo.menuTitle || 'Галерея'
                    },
                    {
                        id: 'news',
                        title: news.menuTitle || 'Новости'
                    },
                ],
                menuRight: [
                    {
                        id: 'prizes',
                        title: prizeObj.menuTitle || 'Призы'
                    },
                    {
                        id: 'history',
                        title: winnersObj ? winnersObj.menuTitle : 'Итоги'
                    },
                    {
                        id: 'documents',
                        title: docs && docs.menuTitle ? docs.menuTitle : 'Документы'
                    },
                    {
                        id: 'feedback',
                        title: feedOut.menuTitle || 'Контакты'
                    },
                ],
                polozhenie: ""
            },
            documents: docs || {},
            feedback: feedOut,
            contextBlock: firstpage ? firstpage.slides : [],
            // about: {
            //     ...history,
            //     stats: history.timelines
            // },
            history: {
                ...history,
                winners: winnersObj ? winnersObj.winners : [],
                pageTitleWinners: winnersObj ? winnersObj.pageTitle : 'Победители',
                winnersListFile: winnersObj ? winnersObj.winnersListFile : null
            },
            mediaInfo,
            gallery,
            participants: {
                "title": participantsData.title,
                "menuTitle": participantsData.menuTitle,
                "pageTitle": participantsData.pageTitle,
                stats: participantsData.numbers || numbers,
                person: participantsData.personInfo
            },
            news: {
                ...news,
                bannerNode: news.banners,
                items: publications
            },
            pagePartners: pagePartners || {},
            partners,
            stages,
            stageInfo,
            prizes: {
                ...prizeObj,
                items: prizeObj.prizes
            }
        }
        // const menuData = []
        //
        // for (let key in outObj) {
        //     if (outObj[key] && !!outObj[key].menuTitle) {
        //         menuData.push( {id: key, title: outObj[key].menuTitle} )
        //     }
        // }
        //
        // outObj.menu = menuData;

        return {
            success: true,
            data: outObj
        }

    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

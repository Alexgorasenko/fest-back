const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId
const moment = require('moment')
const sender = require('../mails/sender')
const logger = require('../logger');

module.exports = async (req, res) => {
    const { superadmin, moderator, rfu_admin } = req.roles
    const { uid } = req.signer
    const { id } = req.params
    const { decision, comment, ...patchBody } = req.body

    if(superadmin || rfu_admin || moderator) {
        if(!id || id.length < 24) {
            res.status(400).json({success: false, message: 'Invalid query id'})
        } else {
            if(typeof(decision) === 'undefined' || (!decision && !comment)) {
                res.status(409).json({success: false, message: 'Invalid request payload'})
            } else {
                const query = await service.fetch({collection: 'queries', _id: new ObjectId(id)})
                if(query) {
                    try {
                        const md = query.moderatorData ? {...query.moderatorData} : {}

                        const patch = {
                            handledAt: moment().toDate(),
                            handledBy: uid,
                            status: decision ? 'VALID' : 'NOT_VALID',
                            moderatorData: !decision ? {...md, ...patchBody, comment: comment} : {...md, ...patchBody}
                        }

                        await service.update({collection: 'queries', _id: query._id}, patch)

                        await logger({
                            action: "put",
                            collection: "queries",
                            id: query._id,
                            authorCollection: 'supervisors',
                            authorId: req.signer.uid,
                            author: req.signer.email || "no_mail",
                            patch: patch
                        })

                        if (query.userId && patch.status && ['NOT_VALID','VALID'].includes(patch.status) && query.status !== patch.status ) {
                            try {
                                if(process.env.INSTANCE && process.env.INSTANCE !== "development") {
                                    const publicUser = await service.fetch({collection: 'publicusers', _id: query.userId})
                                    if (publicUser && publicUser.email) {
                                        let mes = `Ваша заявка на участие во Всероссийский фестиваль «Футбол в школе» `;
                                        const submes = patch.status === 'NOT_VALID' ? `была отклонена. Проверьте, пожалуйста, причину в личном кабинете` : `успешно прошла проверку.`; //Скачайте сертификат в личном кабинете!
                                        const resp = await sender({
                                            subject: 'Изменился статус у заявки',
                                            reciever: publicUser.email,
                                            input: {
                                                changedQueryStatus: true,
                                                message: mes + submes,
                                                link: req.isProdFront ? `https://fests.rfs.ru/apps` : `https://preprod-fests.rfs.ru/apps`
                                            }
                                        })
                                        console.log('resp sender decision', resp, publicUser.email);
                                    }
                                }
                            } catch (e) {
                                console.log('recovery failed', e);
                            }
                        }

                        res.json({success: true})
                    } catch(e) {
                        console.log('decision failed', e);
                        res.status(500).json({success: false, message: 'Internal server error'})
                    }
                } else {
                    res.status(404).json({success: false, message: `Application ${id} not found`})
                }
            }
        }
    } else {
        res.status(403).json({success: true, message: 'Method not allowed for this role'})
    }
}

const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { patchQuery } = require('../modules')
const sender = require('../mails/sender')

const moment = require('moment');

module.exports = async (req, res) => {
    const { id } = req.params
    const { superadmin, moderator } = req.roles

    try {
        const userObjId = getObjId(req.signer.uid)
        const queryId = getObjId(id)

        if (!queryId) {
            res.status(400).json({success: false, message: 'проверьте параметры запроса'})
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }
        const query = await service.fetch({collection: 'queries', _id: queryId})
        if (!query) {
            res.status(400).json({success: false, message: `Заявка ${queryId} не найдена. проверьте параметры`, errorStatus: 400})
            return null
        }
        const {_id, attachmentReports, finishedReports, isPrintFormGetted, attachmentFormId, ...patch} = req.body

        const result = await patchQuery({body: patch, item: id, userObjId: userObjId,  signer: req.signer})

        if (result.errorStatus) {
            res.status(result.errorStatus).json(result)
        } else {
            res.json(result)

            if (query.userId && result.success && !!req.body.status && ['NOT_VALID','VALID'].includes(req.body.status) && query.status !== req.body.status ) {
                try {
                    if(process.env.INSTANCE && process.env.INSTANCE !== "development") {
                        const publicUser = await service.fetch({collection: 'publicusers', _id: query.userId})
                        if (publicUser && publicUser.email) {
                            let mes = `Ваша заявка на участие во Всероссийский фестиваль «Футбол в школе» `;
                            const submes = req.body.status === 'NOT_VALID' ? `была отклонена. Проверьте, пожалуйста, причину в личном кабинете` : `успешно прошла проверку.`; //Скачайте сертификат в личном кабинете!
                            const sendMailBody = {
                                subject: 'Изменился статус у заявки',
                                reciever: publicUser.email,
                                input: {
                                    changedQueryStatus: true,
                                    message: mes + submes,
                                    link: req.isProdFront ? `https://fests.rfs.ru/apps` : `https://preprod-fests.rfs.ru/apps`
                                }
                            }
                            if (req.body.status === 'VALID') {
                                // sendMailBody.attachments = [{   // stream as an attachment
                                //     filename: 'certificate.docx',
                                //     path: '../assets/certificate.docx'
                                //     //content: fs.createReadStream('file.txt')
                                // }]
                                sendMailBody.sendCertificate = true
                            }
                            //console.log('sendMailBody', sendMailBody);
                            const resp = await sender(sendMailBody)
                            //console.log('resp patch sv', resp, publicUser.email);
                        }
                    }
                } catch (e) {
                    console.log('recovery failed', e);
                }
            }

        }

    } catch (e) {
        console.log('SV patch query failed', e);
        res.status(500).json({success: false, message: 'SV patch query failed'})
        return {success: false, message: 'SV patch query failed', errorStatus: 500}
    }
}

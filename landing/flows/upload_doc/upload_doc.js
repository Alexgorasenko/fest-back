const service = require('../../../service');
const { getObjId } = require('../../../utils')
const uploader_doc =  require('../../uploader_doc')
//const uploader_buf_doc =  require('../../uploader_buf_doc')

const moment = require('moment');
const validMimeTypes = ['jpg', 'jpeg', 'png', 'pdf', 'txt','doc', 'xlsx']

const publicdocPatchFieldsObj = {
    userMsg: 'userMsg.userMsgFileId',
    policy: 'policy.policyFileId',
    persData: 'persData.persDataFileId',
    certificateFileId: 'certificateFileId',
    mainInfoFileId: 'mainInfoFileId',
    policyFileId: 'policyFileId',
    personFileId: 'personFileId',
    fileId: 'fileId',
    file: 'file.fileId'
}
// policyFileId: {type: mongoose.Schema.ObjectId, default: null}, //файл политики конфиденциальности
// personFileId: {type: mongoose.Schema.ObjectId, default: null}, //файл перс даннных
module.exports = async ({body, file, folder= 'docs', userId, signer, HOST}) => {
    try {

        const { patchField, base64Data, fileName, sampleId,sampleType='publicdocs' } = body;

        let sampleObj = null;
        const sampleObjId = getObjId(sampleId)

        if (['landingfeedbacks', 'landingwinners', 'landingdocs', 'landingexternallinks'].includes(sampleType)) {
            if (!sampleObjId) {
                return {success: false, message: 'Проверьте параметры', errorStatus: 400}
            }

            let sample = await service.fetch({collection: sampleType, pipeline: [
                {$match: {}},
            ], asEntry: true});

            if (!sample) {
                const cr = await service.save({collection: sampleType}, {});

                if (!cr || !cr._id) {
                    return {success: false, message: 'Объект для вложения не найден', errorStatus: 400}
                }
                sample = {_id: cr._id}
            }
            sampleObj = {...sample}
        }

        if (!base64Data && !file) {
            return {success: false, message: 'Вложения не найдены', errorStatus: 400}
        }

        const attachBody = {
            userId: userId,
            date: moment().format('YY-MM-DD'),
            sampleType: sampleType,
            sampleId: sampleObj ? sampleObj._id : null
        }

        let filePathData = null

        if (file) {
            const stype = file.mimetype.split('/')[1];
            const type = stype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'xlsx' : ['vnd.openxmlformats-officedocument.wordprocessingml.document','msword'].includes(stype)? 'doc' : stype;

            if (!type || !validMimeTypes.includes(type)){
                return {success: false, msg: 'Неверный формат загружаемого файла', errorStatus: 400}
            }
            filePathData = await uploader_doc({file, folder});

        } else if (base64Data) {
            filePathData = await uploader_doc({base64Data, userFileName: fileName, folder});
        }
        if (!filePathData || !filePathData.success || !filePathData.data || !filePathData.data.path) {
            return {success: false, msg: filePathData.msg || "ошибка обработки файла", errorStatus: 400}
        }

        attachBody.path = filePathData.data.path;
        attachBody.filename = filePathData.data.filename;
        attachBody.localname = filePathData.data.localname;
        attachBody.fullpath = HOST + 'landing/' + attachBody.path;

        const attach = await service.save({collection: 'attachments'}, attachBody);
        if (attach && attach._id) {

            if (sampleObj && patchField && publicdocPatchFieldsObj[patchField]) {
                const patch = {
                    [publicdocPatchFieldsObj[patchField]]: attach._id
                }
                //const fullPath = attachBody.fullPath;

                await service.update({collection: sampleType, _id: sampleObj._id}, patch);

            }
            return {success: true, data: {...attachBody, _id: attach._id}}
        } else {

            return {success: false, message: 'userflow upload failed', errorStatus: 500}
        }

    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'userflow upload failed', errorStatus: 500}
    }
}

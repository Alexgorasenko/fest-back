const service = require('../../../service');
const { getObjId } = require('../../../utils')
const uploader_doc =  require('../../uploader_doc')
//const uploader_buf_doc =  require('../../uploader_buf_doc')

const moment = require('moment');
const validMimeTypes = ['jpg', 'jpeg', 'png', 'pdf', 'xlsx']
const directionPatchFields = ['policyFileId', 'personFileId', 'fileId']
// policyFileId: {type: mongoose.Schema.ObjectId, default: null}, //файл политики конфиденциальности
// personFileId: {type: mongoose.Schema.ObjectId, default: null}, //файл перс даннных
module.exports = async (req, item) => {
    try {
        const HOST = req.selfHost
        //const HOST = `https://s3.megafon.cloud/${process.env.FILES_BUCKET_ID}/`;

        const userId = getObjId(req.signer.uid || req.signer._id)
        const { patchField, base64Data, fileName, sampleId,sampleType, ...body } = req.body;

        let sampleObj = null;
        const sampleObjId = getObjId(sampleId)
        const folder = 'docs' //body.sampleType === 'landingdirections' ? 'reports' : 'storage';

        if (['landingfeedbacks', 'landingwinners', 'landingdocs'].includes(sampleType)) {
            if (!sampleObjId) {
                return {success: false, message: 'Проверьте параметры', errorStatus: 400}
            }

            const sample = await service.fetch({collection: sampleType, pipeline: [
                {$match: {
                    _id: sampleObjId
                }},
            ], asEntry: true});

            if (!sample) {
                return {success: false, message: 'Объект для вложения не найден', errorStatus: 400}
            }
            sampleObj = {...sample}
        }

        if (!base64Data && (!req.files || !req.files.file)) {
            return {success: false, message: 'Вложения не найдены', errorStatus: 400}
        }

        const attachBody = {
            userId: userId,
            date: moment().format('YY-MM-DD'),
            sampleType: sampleType,
            sampleId: sampleId
        }

        let filePathData = null

        if (req.files && req.files.file) {
            const { file } = req.files;
            const stype = file.mimetype.split('/')[1];
            const type = stype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'xlsx' : stype;

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
        attachBody.fullpath = req.selfHost + 'landing/' + filePathData.data.path;

        const attach = await service.save({collection: 'attachments'}, attachBody);

        if (attach && attach._id) {

            if (sampleObj && patchField && directionPatchFields.includes(patchField)) {
                const patch = {
                    [patchField]: attach._id
                }
                /*
                const fullPath = req.selfHost + 'landing/' + attachBody.path;

                if (!query[queryField]) {
                    //patch[queryField] = {[nominationId]: attach._id}
                    patch[queryField] = {[nominationId]: fullPath}
                } else {
                    //patch[queryField] = {...query[queryField], [nominationId]: attach._id}
                    patch[queryField] = {...query[queryField], [nominationId]: fullPath}
                }
                */
                await service.update({collection: body.sampleType, _id: sampleObjId}, patch);

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

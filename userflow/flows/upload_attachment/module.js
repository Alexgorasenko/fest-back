const service = require('../../../service');
const { getObjId } = require('../../../utils')
const uploader_attach =  require('../../../uploader_attach')
const uploader_attach_s3 =  require('../../../uploader_attach_s3')

const moment = require('moment');
const validMimeTypes = ['jpg', 'jpeg', 'png', 'pdf']
const queryFields = ['attachmentFormId', 'attachmentReports']

module.exports = async (req, item) => {
    try {
        //const HOST = req.isProdFront ? 'https://api-fests.rfs.ru/' : 'https://preprod-api-fests.rfs.ru/'
        const HOST = `https://s3.megafon.cloud/${process.env.FILES_BUCKET_ID}/`;

        const userId = getObjId(req.signer.uid)
        const body = {...req.body, userId: userId};
        let query = null;
        const sampleId = getObjId(body.sampleId)
        const folder = body.sampleType === 'activityreports' ? 'reports' : 'storage';
        if (folder !== 'reports') {
            if (!body.sampleType || !sampleId) {
                return {success: false, message: 'Проверьте параметры', errorStatus: 400}
            }

            const sample = await service.fetch({collection: body.sampleType, pipeline: [
                {$match: {
                    _id: sampleId
                }},
                {$sort: {_id:-1}}
            ], asEntry: true});

            if (!sample) {
                return {success: false, message: 'Объект для вложения не найден', errorStatus: 400}
            }
            query = {...sample}
        }

        if (!req.files || !req.files.file) {
            return {success: false, message: 'Вложения не найдены', errorStatus: 400}
        }

        body.date = moment().format('YY-MM-DD');

        if (req.files.file) {
            const { file } = req.files;
            const type = file.mimetype.split('/')[1];
            console.log('file',file);

            if (!type || !validMimeTypes.includes(type)){
                return {success: false, msg: 'Неверный формат загружаемого файла', errorStatus: 400}
            }
            const filePathData = await uploader_attach_s3({file: file, userFileName: body.filename, folder: folder});
            console.log('filePathData',filePathData);
            if (!filePathData.success || !filePathData.data || !filePathData.data.path) {
                return filePathData
            }
            body.path = filePathData.data.path;
            body.fullpath = filePathData.data.fullpath;
            body.size = filePathData.data.size;
            body.filename = body.filename ? body.filename : filePathData.data.filename;
            body.localname = filePathData.data.localname;
        }
        const attach = await service.save({collection: 'attachments'}, body);

        if (attach && attach._id) {
            const { queryField, nominationId } = req.query;

            if (body.sampleType === 'queries' && sampleId && queryField && queryFields.includes(queryField)) {

                if (query) {
                    const patch = {}

                    if (queryField === 'attachmentFormId') {
                        patch[queryField] = attach._id
                    } else {
                        if (nominationId) {
                            const fullPath = HOST + body.path;
                            if (!query[queryField]) {
                                //patch[queryField] = {[nominationId]: attach._id}
                                patch[queryField] = {[nominationId]: fullPath}
                            } else {
                                //patch[queryField] = {...query[queryField], [nominationId]: attach._id}
                                patch[queryField] = {...query[queryField], [nominationId]: fullPath}
                            }
                        } else {
                            console.log('nominationId not found');
                        }
                    }
                    await service.update({collection: 'queries', _id: sampleId}, patch);

                }

            }
            return {success: true, data: {...body, _id: attach._id}}
        } else {
            return {success: false, message: 'userflow upload failed', errorStatus: 500}
        }

    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'userflow upload failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const { getObjId } = require('../../../utils')
const uploader_attach_s3 =  require('../../../uploader_attach_s3')

const moment = require('moment');
const validMimeTypes = ['jpg', 'jpeg', 'png']

module.exports = async (req, item) => {
    try {
//console.log(req.signer);
        //const userId = getObjId(req.signer.uid)
        const folder = req.body.sampleType || "storage";

        if (!req.files) {
            return {success: false, message: 'Вложения не найдены', errorStatus: 400}
        }

        for (let fileKey in req.files) {
            const file = req.files[fileKey];
            const type = file.mimetype.split('/')[1];
console.log(file);
            if (!type || !validMimeTypes.includes(type)){
                return {success: false, msg: 'Неверный формат загружаемого файла ' + fileKey + ' ' + file.name, errorStatus: 400}
            }
        }
        const out = {}

        for (let fileKey in req.files) {
            const file = req.files[fileKey];

            const filePathData = await uploader_attach_s3({file, folder, bucket: 'land123-vmf'});

            if (!filePathData.success || !filePathData.data || !filePathData.data.path) {
                console.log('error uploading', fileKey, filePathData);
            }
            out[fileKey] = filePathData

        }
        return {success: true, data: out}

    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'userflow upload failed', errorStatus: 500}
    }
}

const service = require('../../../service');
const uploader_attach_s3 =  require('../../../uploader_attach_s3')

const moment = require('moment');
const validMimeTypes = ['jpg', 'jpeg', 'png', 'pdf']

module.exports = async (req, item) => {
    try {
        //const userId = getObjId(req.signer.uid)

        const { base64Data, fileName, sampleType } = req.body;

        const folder = sampleType || 'reports';

        if (!base64Data) {
            return {success: false, message: 'Вложения не найдены', errorStatus: 400}
        }

        const filePathData = await uploader_attach_s3({base64Data, userFileName: fileName, folder , bucket: 'land123-vmf'});
        // "FILES_BUCKET": "https://s3.megafon.cloud/",
        // "FILES_BUCKET_ID": "mhzbd276-kp",
   //      "data": {
   //     "path": "reports/cc59b6f8-5b59-4605-846a-50867d4c0787.png",
   //     "filename": "fafaf.png",
   //     "localname": "cc59b6f8-5b59-4605-846a-50867d4c0787.png"
   // }
        return filePathData

    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'userflow upload failed', errorStatus: 500}
    }
}

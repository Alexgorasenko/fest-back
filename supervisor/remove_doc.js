const service = require('../service');
const { getObjId } = require('../utils')

const path = require('path');
const fs = require('fs')

const publicdocPatchFieldsObj = {
    userMsg: 'userMsg.userMsgFileId',
    policy: 'policy.policyFileId',
    persData: 'persData.persDataFileId',
    certificateFileId: 'certificateFileId',
    mainInfoFileId: 'mainInfoFileId',
}

module.exports = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            res.status(400).json({success: false, message: `проверьте параметры`, errorStatus: 400})
            return {success: false, message: 'check params', errorStatus: 400}
        }
        const objId = getObjId(id);

        const userId = getObjId(req.signer.uid)

        const attach = await service.fetch({collection: 'attachments', _id: objId});

        if (!attach) {
            res.status(400).json({success: false, message: `вложение ${id} не найдено`, errorStatus: 400})
            return {success: false, message: `вложение ${id} не найдено`, errorStatus: 400}
        }

        const { patchField, sampleType='publicdocs' } = req.query;

        const resRem = await service.delete({collection: 'attachments', _id: objId});
        if (attach.path) {
            const pathToFile = path.join(`${__dirname}`, `../`, attach.path)
            const resRemove = await _removeFile(pathToFile);

            if (!resRemove) {
                console.log('removing file failed. pathToFile: ', pathToFile)
            }
        }
        if (patchField && publicdocPatchFieldsObj[patchField]) {
            const datas = await service.fetch({collection: sampleType, [publicdocPatchFieldsObj[patchField]]: objId});

            if (datas && datas.length) {
                console.log(datas.length);
                for (let doc of datas) {
                    await service.update({collection: sampleType, _id: doc._id}, {[publicdocPatchFieldsObj[patchField]]: null});
                }
            }
        }
        res.json({success: true})

    } catch (e) {
        console.log('removing file failed', e);
        res.status(500).json({success: false, message: `удалить файл не удалось`, errorStatus: 400})
        return {success: false, message: 'removing file failed', errorStatus: 500}
    }
}

const _removeFile = (pathToFile) => {
    return new Promise((resolve, reject) => {
        fs.unlink(pathToFile, (err) => {
            if (err){
                resolve(false)
            }else{
                resolve(true)
            }
        });
    });
}

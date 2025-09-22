const service = require('../../../service');
const { getObjId } = require('../../../utils')
const path = require('path');
const fs = require('fs')
const directionPatchFields = ['policyFileId', 'personFileId', 'fileId']

const patchFieldsObj = {
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

module.exports = async (req, item) => {
    try {
        if (!item) {
            return {success: false, message: 'check params', errorStatus: 400}
        }
        const objId = getObjId(item);

        const userId = getObjId(req.signer.uid)

        const attach = await service.fetch({collection: 'attachments', _id: objId});

        if (!attach) {
            return {success: false, message: `вложение ${item} не найдено`, errorStatus: 400}
        }

        const { patchField, sampleType } = req.query;

        const resRem = await service.delete({collection: 'attachments', _id: objId});
        if (attach.path) {
            const pathToFile = path.join(`${__dirname}`, `../../`, attach.path)
            console.log(pathToFile);
            const res = await _removeFile(pathToFile);

            if (!res) {
                console.log('removing file failed. pathToFile: ', pathToFile)
            }
        }
        if (sampleType && patchField && patchFieldsObj[patchField]) {
            const datas = await service.fetch({collection: sampleType, [patchFieldsObj[patchField]]: objId});

            if (datas && datas.length) {
                console.log(datas.length);
                for (let doc of datas) {
                    await service.update({collection: sampleType, _id: doc._id}, {[patchFieldsObj[patchField]]: null});
                }
            }
        }
        return {success: true}

    } catch (e) {
        console.log('removing file failed', e);
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

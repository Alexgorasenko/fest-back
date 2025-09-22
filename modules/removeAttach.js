const service = require('../service');
const path = require('path');
const fs = require('fs')
const { getObjId } = require('../utils')

module.exports = async (item) => {
    try {
        const objId = getObjId(item);

        if (!objId) {
            return {success: false, message: 'check params', errorStatus: 400}
        }
        const attach = await service.fetch({collection: 'attachments', _id: objId});

        if (!attach) {
            return {success: false, message: `вложение ${item} не найдено`, errorStatus: 400}
        }
        //return req.files
        const resRem = await service.delete({collection: 'attachments', _id: objId});
        const pathToFile = path.join(`${__dirname}`, `../`, 'storage/', attach.localname)

        const res = await _removeFile(pathToFile);
        if (!res) {
            console.log('removing file failed. pathToFile: ', pathToFile)
        }
        return {success: true}
    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'removing attach failed', errorStatus: 500}
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

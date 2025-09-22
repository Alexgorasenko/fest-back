const path = require('path');
const fs = require('fs')
const axios = require('axios')

const moment = require('moment')

const { v4: uuidv4, v5: uuidv5 } = require('uuid');

const validImage = ['jpg', 'jpeg', 'png', 'pdf', 'xlsx']

module.exports = async ({file, folder='publicdocs', base64Data, userFileName}) => {

    try {
        if (!base64Data && (!file || !file.data)) {
            return {success: false, msg: 'Нет данных для загрузки', errorStatus: 400}
        }
        const splittedBase = base64Data ? base64Data.split(',') : null;
        const baseMime = splittedBase ? splittedBase[0] : null;
        let mime = null;

        switch (true) {
            case (!!(file && file.mimetype)):
                mime = file.mimetype
                console.log(file.mimetype);
                break;
            case (!!(baseMime && baseMime.includes('png'))):
                mime = 'image/png'
                break;
            case (!!(baseMime && baseMime.includes('jpeg'))):
                mime = 'image/jpeg'
                break;
            case (!!(baseMime && baseMime.includes('application/pdf'))):
                mime = 'application/pdf'
                break;
            case (!!(baseMime && baseMime.includes('sheet'))):
                mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                break;
            default:
                mime = 'image/jpg'
                break;
        }


        if (!mime){
            return {success: false, msg: 'Неверный формат загружаемого файла',  errorStatus: 400}
        }

        const buffer = splittedBase ? Buffer.from(splittedBase[1], 'base64') : null

        const stypeFile = mime.split('/')[1];
        const typeFile = stypeFile === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'xlsx' : stypeFile;
        console.log('typeFile', typeFile, mime);

        if (!typeFile || !validImage.includes(typeFile.toLowerCase())){
            return {success: false, msg: 'Неверный формат загружаемого файла',  errorStatus: 400}
        }

        const fileName = `${uuidv4()}.${typeFile}`

        try {
          if (!fs.existsSync(`./${folder}`)) {
            fs.mkdirSync(`./${folder}`);
          }
        } catch (err) {
          console.log('err crate dir' + `drafts/${folder}`, err);
          return {success: false, msg: 'Не смог сохранить файл', errorStatus: 501}
        }
        const pathToFile = path.join(`${__dirname}`, `./`, `${folder}/`, fileName)

        const saveFile = file ? await _moveFile(file, pathToFile) : await fsWriteFile(buffer, pathToFile)

        if (!saveFile || !saveFile.success){
            return {success: false, msg: 'Не смог сохранить файл', errorStatus: 501}
        }

        return {
            success: true,
            data: {
                path: `${folder}/${fileName}`,
                filename: userFileName || file.name,
                localname: fileName
            }
        }
    } catch (e) {
        console.log('uploader failed', e);
        return {success: false, msg: 'Не смог сохранить файл', errorStatus: 501}
    }

}
const _moveFile = (file, pathToFile) => {
    return new Promise((resolve, reject) => {
        file.mv(pathToFile, (err) => {
            if (err){
                console.log('_moveFile error', err);
                resolve({success: false})
            }else{
                resolve({success: true})
            }
        })
    });
}

const fsWriteFile = async (buffer, pathToFile) => {
    try {
        await fs.writeFile(pathToFile, buffer, (err) => {
          if (err) throw err;
        })
        return {success: true}
    } catch (e) {
        console.log('fsWriteFile err', e);
        return {success: false}
    }
}

const createFile = async (base64Data, pathToFile) => {
    const readStream = fs.createReadStream(base64Data);
    const writeStream = fs.createWriteStream(pathToFile);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', function () {
        fs.unlink(oldPath, callback);
    });

    readStream.pipe(writeStream);
}

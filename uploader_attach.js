const path = require('path');
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');

const validImage = ['jpg', 'jpeg', 'png', 'pdf']

module.exports = async (file, userFileName, folder='storage') => {

    try {
        if (!file) {
            return {success: false, msg: 'Нет данных для загрузки', errorStatus: 400}
        }
        const mime = file.mimetype;
        // return mime
        if (!mime){
            return {success: false, msg: 'Неверный формат загружаемого файла',  errorStatus: 400}
        }

        const type = mime.split('/')[1]
        if (!type || !validImage.includes(type)){
            return {success: false, msg: 'Неверный формат загружаемого файла',  errorStatus: 400}
        }

        const fileNameIn = userFileName ? userFileName.split('.') : file.name.split('.')
        const typeFile = fileNameIn[fileNameIn.length - 1]

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

        const saveFile = await _moveFile(file, pathToFile)

        if (!saveFile){
            return {success: false, msg: 'Не смог сохранить файл', errorStatus: 501}
        }

        return {
            success: true,
            data: {
                path: `${folder}/${fileName}`,
                size: file.size,
                filename: userFileName || file.name,
                localname: fileName
            }
        }
    } catch (e) {
        console.log('uploader failed', e);
        return {success: false, msg: 'Не смог сохранить файл', errorStatus: 501}
    }

}


const isEmpty = (obj) => {
    for (let key in obj) {
      // если тело цикла начнет выполняться - значит в объекте есть свойства
      return false;
    }
    return true;
}

const _moveFile = (file, pathToFile) => {
    return new Promise((resolve, reject) => {
        file.mv(pathToFile, (err) => {
            if (err){
                resolve(false)
            }else{
                resolve(true)
            }
        })
    });
}

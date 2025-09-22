const path = require('path');
const fs = require('fs')
const axios = require('axios')
//sfl
const AWS = require('aws-sdk')

const s3BucketCreds = process.env.BUCKET_CREDS ?  JSON.parse(process.env.BUCKET_CREDS) : {
    "accessKeyId": "6RroaHBngAM7JrByKEdn8hBEFGeX8irBSUiVjmqz4Xhy0AZfGPddp9scNXC5fn2RiS392hbtaRxBEGEshe8a9Dn2v",
    "secretAccessKey": "79a6471a7bf93562f8fe0ce6eaf3ba26fc52e56885e74182cd6c433c0b98fcce",
    "endpoint": "https://s3.megafon.cloud",
    "region":"ru-msk2",
    "s3ForcePathStyle": true
};

AWS.config.update(s3BucketCreds)

const s3 = new AWS.S3()

const moment = require('moment')

const { v4: uuidv4 } = require('uuid');

const validImage = ['jpg', 'jpeg', 'png', 'pdf']

module.exports = async ({file, userFileName, folder='storage'}) => {

    try {
        if (!file || !file.data) {
            return {success: false, msg: 'Нет данных для загрузки', errorStatus: 400}
        }
        const mime = file.mimetype;
        // return mime
        if (!mime){
            return {success: false, msg: 'Неверный формат загружаемого файла',  errorStatus: 400}
        }
        const fileNameIn = userFileName ? userFileName.split('.') : file.name.split('.')

        //const typeFileSave = fileNameIn[fileNameIn.length - 1]
        //
        // if (!typeFile || !validImage.includes(typeFile)){
        //     return {success: false, msg: 'Неверный формат загружаемого файла',  errorStatus: 400}
        // }
        const typeFile = file.mimetype.split('/')[1];
        if (!typeFile || !validImage.includes(typeFile.toLowerCase())){
            return {success: false, msg: 'Неверный формат загружаемого файла',  errorStatus: 400}
        }
        // s3.createBucket({Bucket: 'kp'}).done(function(resp) {
        //   console.log('success', resp);
        // }).fail(function(resp) {
        //   console.log('err',resp.error);
        // });

        const fileName = `${uuidv4()}.${typeFile}`

        const savedFile = await uploadFile(mime, fileName, folder, file.data )
        if (!savedFile || !savedFile.success){
            return {success: false, msg: 'Не смог сохранить файл', errorStatus: 501}
        }

        return {
            success: true,
            data: {
                path: `${folder}/${fileName}`,
                size: file.size,
                filename: userFileName || file.name,
                localname: fileName,
                fullpath:  `${process.env.FILES_BUCKET}${process.env.FILES_BUCKET_ID}/${folder}/${fileName}`,
            }
        }
    } catch (e) {
        console.log('uploader failed', e);
        return {success: false, msg: 'Не смог сохранить файл', errorStatus: 501}
    }

}

const uploadFile = (mime, fileName, folder, fileData) => {
    const uploadObj = {
        Bucket: process.env.FILES_BUCKET_ID,
        Key: folder + '/'+fileName,
        Body: fileData,
        ContentType: mime,
        //ACL: 'public-read',
    };
    console.log('uploadFile', uploadObj);
    return new Promise((resolve, reject) => {
        //let fileStream = fs.createReadStream(pathToFile);
        // fileStream.once('error', reject);
        s3.upload(
            uploadObj,
            async (err, resultUpload) => {
                //fs.unlinkSync(pathToFile)
                if (!err){
                    resolve({success: true, data:resultUpload})
                }else{
                    console.log('uploadFile err', err);
                    resolve({success: false, data:err})
                }

            }
        )
    })
}

const removeFileFromBucket = (folder, fileName) => {
    if (!fileName) {
        return {success: false, data: 'fileName not found'}
    }
    // const AWS = require('aws-sdk')
    // AWS.config.update({
    //     accessKeyId: 'cc03946',
    //     secretAccessKey: 'e18f3b78452c081038b7be050a4a3668',
    //     endpoint: 'https://s3.timeweb.com'
    // })
    //console.log('removeFileFromBucket', `bills/5ka_ug/${fileName}`);
    return new Promise((resolve, reject) => {
        s3.deleteObject(
            {
                Bucket: process.env.FILES_BUCKET_ID,
                Key: folder + '/' + fileName,
            },
            (err, result) => {
                if (!err){
                    resolve({success: true, data:result})
                } else{
                    resolve({success: false, data:err})
                }

            }
        )
    })
}

const service = require('../service')
const path = require('path');
const fs = require('fs')
const moment = require('moment')
const sender_udp_message = require('../sender_udp_message')

module.exports = async (data) => {
    const { action, collection, id, authorCollection, authorId, author, patch } = data
    if (!action || !collection || !authorCollection || !authorId || !author) {
        return null
    }
    const date = moment().format('YYYYMMDD');
    const fileName = `${date}_${collection}.txt`

    try {

        const message = collection === 'publicusers' ?  `[${moment().utc(false).format()}][INFO][AGREEMENT_CHECKED][${action}][${collection}][${id}][${author}][${authorCollection}][${authorId}]\n` : `[${moment().utc(false).format()}][INFO][${action}][${collection}][${id}][${author}][${authorCollection}][${authorId}]\n`

        const pathToFolder = path.join(`${__dirname}`, `./`, 'logs/')

        if (!fs.existsSync(pathToFolder)) {
          fs.mkdirSync(pathToFolder);
        }
        const pathToFile = path.join(`${__dirname}`, `./`, 'logs/', fileName)
        if (!fs.existsSync(pathToFile)) {
            fs.writeFileSync(pathToFile, message);
        } else {
            fs.appendFileSync(pathToFile, message);
        }
        await sender_udp_message(message)
        await service.save({collection: 'loggers'}, {...data, collectionName: collection, fileName: fileName})
    } catch(e) {
        console.log(`error saving log ${fileName}`, e)
    }
}

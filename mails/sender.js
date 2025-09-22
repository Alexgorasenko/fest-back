const nodemailer = require('nodemailer')
const domain = 'mail.amateum.com'
const SMTP_PASS = 'fgHHsdydj876'
const fs = require('fs')
const hbs = require('hbs')
const path = require('path')

// const transporter = nodemailer.createTransport({
//    host: "smtp.eu.mailgun.org",
//    port: 587,
//    auth: {
//      user: `postmaster@${domain}`,
//      pass: SMTP_PASS,
//    }
// })

const transporter = nodemailer.createTransport({
   host: "10.109.2.11",
   port: 25,
   secure: false,
   ignoreTLS: true,
   auth: {
     user: `fest@rfs.ru`,
     pass: 'TR982x5J',
   }
})

module.exports = payload => {
    const { reciever, subject, input, sendCertificate } = payload

    try {
        const tplSource = fs.readFileSync(path.join(__dirname, '/views/root.hbs'), 'utf8')
        const template = hbs.compile(tplSource)
        const html = input.message ? `<p>${input.message}</p>` : template(input)
        return new Promise((resolve, reject) => {
            const data = {
                from: `Футбол в школе <fest@rfs.ru>`,
                to: reciever,
                subject: subject,
                html: html
            }
            if (sendCertificate) {
                const certPath = path.join(__dirname, '../assets/certificate.docx')
                //console.log('certPath', certPath);
                data.attachments = [{   // stream as an attachment
                    filename: 'certificate.docx',
                    path: certPath
                    //content: fs.createReadStream('file.txt')
                }]
            }
            transporter.sendMail(data)
                .then(info => {
                    resolve(true)
                }).catch(err => {
                    reject(err)
                })
        })
    } catch (e) {
        console.log('sender failed', payload, e)
        return null
    }
}

const logger = require('../../../logger');
const sender = require('../../../mails/sender');

module.exports = async (req) => {
    const { fields, title, subtitle, mail} = req.body
    if (!mail || !fields || !fields.length) {
        return {success: false,errorStatus: 400, message: `проверьте передаваемые поля`}
    }

    let msgOut = ``;
    let usermail = '';
    for (let field of fields) {
        if (field.name) {
            msgOut += `${field.name}: ${field.value};` + '<br>' + '\n'
            if (!usermail && field.name.includes('mail') || field.name.includes('очта')) {
                usermail = field.value || ""
            }
        }

    }

    if(process.env.INSTANCE && process.env.INSTANCE !== "development") {
        try {
            const resp = await sender({
                subject: title || "Стать участником",
                reciever: mail,
                input: {
                    message: msgOut
                }
            })
        } catch (e) {
            console.log('onboarding err', e);
            return {success: false,errorStatus: 500, message: `ошибка отправки сообщения`}
        }
    }

    await logger({
        action: "mail",
        collection: "onboarding",
        id: "",
        authorCollection: "onboarding",
        authorId: usermail || "no_mail",
        author: usermail || "no_mail",
        patch: {message: msgOut}
    })

    return {success: true}

}

// const validatePwd = (password, hash) => {
//     return new Promise((resolve, reject) => {
//         bcrypt.compare(password, hash, (err, result) => {
//             resolve(result)
//         })
//     })
// }

const jwt = require('jwt-simple')
const secret = 'h$_Utr9908BnN8FGdd1'

module.exports = {
    commonCompose: payload => {
        const token = jwt.encode(payload, secret)
        return token
    },
    composeVerifyToken: payload => {
        const { email, _id, createdAt } = payload
        const token = jwt.encode({ email, _id, createdAt }, secret)
        return token
    },
    decomposeToken: token => {
        try {
            const data = jwt.decode(token, secret)
            return data
        } catch (e) {
            console.log(e)
            return {}
        }
    }
}

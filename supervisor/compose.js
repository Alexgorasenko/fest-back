const { commonCompose } = require('../user/tokens')

module.exports = async (req, res) => {
    const { _id, createdAt, email, password } = req.body
    const tkn = commonCompose({_id, createdAt, email, hash: password})

    res.json(tkn)
}

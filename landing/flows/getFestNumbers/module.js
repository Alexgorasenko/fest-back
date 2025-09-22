const { getNumbers } = require('../../modules')

module.exports = async (req) => {

    const numbers = await getNumbers()
    return numbers

}

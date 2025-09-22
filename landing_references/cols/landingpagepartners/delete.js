const service = require('../../../service');
module.exports = async (req, id) => {

    if (!id) {
        return {error: true, msg: 'проверьте параметры'}
    }
    try {
        const res = await service.delete({collection: "landingpagepartners", _id:id })
        return {success: !!(res && res.deletedCount), data: res}
    } catch (e) {
        console.log('landingpagepartners err', e)
        return {success: false, errorStatus: 500, message: 'ошибка удаления'}
    }

}

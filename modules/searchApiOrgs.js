const HOST = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/'
const API_KEY = 'c9f31b973b432d4d101429ce10bca1f8833118b6'
const axios = require('axios')

module.exports = async (inn) => {
    try {
        if(inn.length < 5) {
            return {success: false, message: 'INN query must have more than 4 chars'}
        } else {
            const raw = await axios.post(`${HOST}suggest/party`, {
                query: inn,
                count: 20,
                type: 'LEGAL',
                okved: ["85.11", "85.12", "85.13", "85.14"]
            }, {
                headers: {
                    authorization: `Token ${API_KEY}`
                }
            })
            const formatted = formatResults(raw.data.suggestions)

            return {success: true, data: formatted}
        }
    } catch(e) {
        console.log('API failed', e)
        return {success: false, message: 'Internal server error', data: []}
    }
}

const formatResults = arr => {
    return arr.map(org => {
        try {
            const { name, inn, ogrn, address, kpp } = org.data

            return {
                name: name.short_with_opf,
                fullName: name.full_with_opf,
                inn,
                ogrn,
                kpp,
                address: {
                    display: address.unrestricted_value,
                    region: {
                        name: address.data.region_with_type,
                        kladr_id: address.data.region_kladr_id,
                        federal_district: address.data.federal_district
                    },
                    city: {
                        name: address.data.city_with_type || address.data.settlement_with_type,
                        kladr_id: address.data.city_kladr_id || address.data.settlement_kladr_id
                    }
                }
            }
        } catch(e) {
            return null
        }
    }).filter(org => org)
}

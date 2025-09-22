const moment = require('moment');
const axios = require('axios');

const service = require('../../../service');

const API_KEY = 'c9f31b973b432d4d101429ce10bca1f8833118b6';
const SECRET_KEY = 'cda9e49279352f891aabb078a41ba3932aeca381';
const PROXY = {
    protocol: 'http',
    host: 'zproxy.lum-superproxy.io',
    port: '22225'
}
const countries = {

}

module.exports = async (req) => {
    try {
        const { query } = req
        if (!query.inn) {
            res.json({success: false, message:'check params'})
        }
        const options = {
            headers: {
                authorization: 'Token ' + API_KEY, //'Token 2216fb81d9f496b1fb24eaf1d9d14d5fdd655165',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                // Origin: "https://vypiska-nalog.com",
                // Referer:"https://vypiska-nalog.com/"
            },

        }
        //const resp = await axios.post(`${STATS_HOST}admin/createStatForEngineMatch`, form, options);
        //const resp = await axios.get(`https://vbankcenter.ru/contragent/api/web/counterparty/filter?prefixSearch=true&size=7&page=0&searchStr=${body.inn}`, options);
        //const resp = await axios.post(`https://www.b-kontur.ru/async/code-search-kalkulyator?inn=${body.inn}&ogrn=`,{}, options);
        //const resp = await axios.get(`https://www.rusprofile.ru/ajax.php?query=${body.inn}&action=search&cacheKey=0.17916386642150717`,{}, options);

        // const resp = await axios.post(`https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party`, {count: 5, locations_boost: [{
        //     capital_marker: "2",
        //     city: "Калининград",
        //     city_fias_id: "df679694-d505-4dd3-b514-4ba48c8a97d8",
        //     city_kladr_id: "3900000100000",
        //     city_type: "г",
        //     city_type_full: "город",
        //     city_with_type: "г Калининград",
        //     country: "Россия",
        //     country_iso_code: "RU",
        //     federal_district: "Северо-Западный",
        //     fias_actuality_state: "0",
        //     fias_id: "df679694-d505-4dd3-b514-4ba48c8a97d8",
        //     fias_level: "4",
        //     geo_lat: "54.70739",
        //     geo_lon: "20.507307",
        //     geoname_id: "554234",
        //     kladr_id: "3900000100000",
        //     okato: "27401000000",
        //     oktmo: "27701000001",
        //     postal_code: "236001",
        //     qc_geo: "4",
        //     region: "Калининградская",
        //     region_fias_id: "90c7181e-724f-41b3-b6c6-bd3ec7ae3f30",
        //     region_iso_code: "RU-KGD",
        //     region_kladr_id: "3900000000000",
        //     region_type: "обл",
        //     region_type_full: "область",
        //     region_with_type: "Калининградская обл",
        //     tax_office: "3900",
        //     tax_office_legal: "3900",
        //     timezone: "UTC+2",
        // }], query: body.inn}, options);
        const resp = await axios.post(`https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party`, {query: query.inn, count: 10}, options);
        //res.json({success: true, data: resp.data})
        if (!resp.data || !resp.data.suggestions || !resp.data.suggestions.length) {
            return {success: false, message: 'userflow get by inn failed'}
        }

        const mappedResp = [];
        for (let orgData of resp.data.suggestions) {
            const { data, value,  unrestricted_value} =  orgData
            const addressData = data.address || null;
            const idsAddresses = await getAddresses(addressData)

            const orgMapdBody = {
                fullName: data.name ? data.name.full_with_opf : '',
                name: data.name ? data.name.short_with_opf : '',
                //type: ,
                postAddress: data.address ? data.address.unrestricted_value : '',
                site: null,
                active: true,
                // userId: ,
                // createdAt: ,
                requisites: {
                    inn: query.inn,
                    kpp: data.kpp,
                    ogrn: data.ogrn,
                    opf: data.opf,
                    okpo: data.okpo,
                    okato: data.okato,
                    oktmo: data.oktmo,
                    okogu: data.okogu,
                    okfs: data.okfs,
                    okved: data.okved,
                    okveds: data.okveds,
                    okved_type: data.okved_type
                },
                address: addressData ? {
                    postal_code: addressData.postal_code,
                    federal_district: addressData.federal_district,
                    city_district_type_full: addressData.city_district_type_full,
                    city_district_type: addressData.city_district_type,
                    city_district: addressData.city_district,
                    street_with_type: addressData.street_with_type,
                    street_type: addressData.street_type,
                    street_type_full: addressData.street_type_full,
                    street: addressData.street,
                    house_type: addressData.house_type,
                    house_type_full: addressData.house_type_full,
                    house: addressData.house,
                    kladr_id: addressData.kladr_id,
                    okato: addressData.okato,
                    oktmo: addressData.oktmo,
                    timezone: addressData.timezone,
                    geo_lat: addressData.geo_lat,
                    geo_lon: addressData.geo_lon,
                    source: addressData.source,
                } : null,
                phone: data.phones || null,
                email: data.emails || null,
                apiFullBody: orgData,
                ...idsAddresses
            }
            mappedResp.push(orgMapdBody)
        }
        //const orgData = resp.data.suggestions[0];

        return {success: true, data: mappedResp}
    } catch (e) {
        console.log('userflow get by inn', e);
        return {success: false, message: 'userflow get by inn', errorStatus: 500}
    }
}

const saveData = async ({collection, body}) => {
    let savedData = await service.save({collection: collection}, body);
    if (savedData._id) {
        return {_id: savedData._id, ...body}
    } else {
        savedData = await service.save({collection: collection}, body);
        if (savedData._id) {
            console.log('SECOND SAVING FAILED');
            return {_id: savedData._id, ...body}
        } else {
            return {success: false, message:`saved ${collection} failed`}
        }
    }
}

const getAddresses = async (addressData) => {
    const idsAddresses = {
        countryId: null,
        regionId: null,
        settlementId: null,
    }
    return idsAddresses

    if (addressData.country) {
        let country = await service.fetch({collection: 'countries', name: addressData.country, asEntry: true});
        if (!country) {
            const countryBody = {
                name: addressData.country,
                code: addressData.country_iso_code
            }
            country = await saveData({collection: 'countries', body: countryBody});
            if (!savedCountry._id) {
                return idsAddresses
            }
            idsAddresses.countryId = savedCountry._id
        }
        if (addressData.region_with_type) {
            let region = await service.fetch({collection: 'regions', countryId: country._id, name: addressData.region_with_type, asEntry: true});

            if (!region) {
                const teryBody = {
                    name: addressData.region_type_full,
                    code: addressData.region_iso_code,
                    federal_district: addressData.federal_district
                }
                region = await saveData({collection: 'regions', body: teryBody});
                if (!region._id) {
                    return idsAddresses
                }
                idsAddresses.regionId = region._id
            }
            const settleName =  addressData.city || addressData.settlement || null;

            if (settleName) {
                let settlement = await service.fetch({collection: 'settlements', regionId: region._id, name: settleName, asEntry: true});

                if (!settlement) {
                    const settlementBody = {
                        name: settleName,
                        code: addressData.city_type_full || addressData.settlement_type_full || null
                    }
                    settlement = await saveData({collection: 'settlements', body: settlementBody});
                    if (!settlement._id) {
                        return idsAddresses
                    }
                    idsAddresses.settlementId = settlement._id
                }
            }
        }
    }
    return idsAddresses
}

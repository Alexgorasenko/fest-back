const service = require('../../service')
const ObjectId = require('mongoose').Types.ObjectId
const moment = require('moment')
const axios = require('axios')
const sleep = require('util').promisify(setTimeout)

// const getVKAlbums = require('./getVKAlbums');
// const getVKArticle = require('./getVKArticle');

const base = 'https://api.vk.com/method/';
const vers = '5.194';

const mod = async () => {
    try {
        //const { access, remoteId, vkAppId, remoteName='lflvoronezh' } = entity
        let newsData = await service.fetch({collection: 'landingnews', pipeline: [
            {$match: {}}
        ], asEntry: true})

        if (!newsData || !newsData.getvknews) {
            console.log('не требуется запрос данных');
            return {success: false, msg: 'не требуется запрос данных'}
        }

        if (!newsData.vklink) {
            console.log('не заполнена группа вк');
            return {success: false, msg: 'не заполнена группа вк'}
        }
        const hashtag = newsData.hashtag || "#ФестивальФВШ"
        const domain = newsData.vklink.split('/').pop() //'footballatschools';

        const access = 'vk1.a.pd7iS_CNdAVtB50PI4dQwcbHzNDEgwd9S9stQCUFSHpqDw1BfjBrKF6_tBu4UZTyYa119WOZdjyeYDaMCSD9k2ienKIdOIRxm8gh4jlaY9wRgS48HY_cEvmYQlF95KoMFsgMUN0pb_Ni4n7u5-IAdY9TeWtvr5v6mYibqqq0AA4OLCBa9MiNeL5Pi4uqDEkHMIKTYNdwkd0OjRO7-pVYDA';

        const startDateUnix = moment().add(-10, 'days').unix()

        const url = `${base}wall.get?access_token=${access}&domain=${domain}&count=50&v=${vers}`
        const resp = await axios.get(url)

        if(!resp || !resp.data || !resp.data.response) {
            return resp.data
        }

        const { items, count } = resp.data.response;

        const filtredItems = items.filter(p => p.text && p.text.includes(hashtag))

        const ids = filtredItems.map(i => i.id)

        const stored = await service.fetch({collection: 'landingpublications', pipeline: [
            {$match: {
                socialVkData: {$ne: null},
                "socialVkData.domain": domain,
                "socialVkData.vkId": {$in: ids},
            }}
        ]})

        const storedIds = stored.map(st => st.socialVkData.vkId)

        const pull = filtredItems
            .filter(i => !storedIds.includes(i.id))
            .map(p => {
                const mappedAttachs = p.attachments && p.attachments.length ? attahmentsMapper({attachs: p.attachments.slice(0, 10), getImg: true}) : [];

                return {
                    socialVkData: {
                        inner_type: p.inner_type,
                        hash: p.hash,
                        type: p.type,
                        from_id: p.from_id,
                        edited: p.edited,
                        vkId: p.id,
                        owner_id: p.owner_id,
                        post_type: p.post_type,
                        domain: domain,
                        outerLink: `https://vk.com/${domain}?w=wall${p.from_id}_${p.id}`
                    },
                    body: [
                        {
                            key: "content",
                            text: p.text,
                            id: "text1"
                        },
                        {
                            key: "attachments",
                            images: mappedAttachs,
                            id: "attachments0"
                        }
                    ],
                    //attachments: mappedAttachs,
                    date: p.date,
                    datePublished: moment(p.date,'X').format('YYYY.MM.DD'),

                    title: p.text.split('\n')[0],
                    imgLink: mappedAttachs[0] //getImgLinkFromAttach(),

                }
            })

        console.log('pull posts', pull.length);
        const res = pull.length ? await service.insertMany({collection:"landingpublications"}, pull) : null

        return {success: true, data: res}
    } catch (e) {
        console.log('method getVKPosts faild', e);
        return {success: false}
        //res.json(null)
    }
}

const attahmentsMapper = ({attachs, getImg=false}) => {
    let mapdAttachs = [];

    for (let att of attachs) {
        const { type, photo, video, link, album } = att;
        switch (type) {
            case 'photo':
                const dataAtt = {
                    type: type,
                    photo: {
                        ...photo,
                        sizes: [photo.sizes[0], photo.sizes[photo.sizes.length - 1]]
                    }}
                mapdAttachs.push(getImg ? getImgLinkFromAttach(dataAtt) : dataAtt)
                break;
            case 'video':
                const {access_key, date, duration, image, first_frame, id, width, height, ov_id, title, track_code } = video;
                //console.log('video', video);
                const dataVideoAttach = {
                    type: type,
                    video: {
                        access_key,
                        date,
                        duration,
                        image,
                        first_frame,
                        id,
                        width,
                        height,
                        ov_id,
                        title,
                        track_code
                    }}
                mapdAttachs.push(getImg ? getImgLinkFromAttach(dataVideoAttach) : dataVideoAttach )
                break;
            case 'link':
                if(link.photo) {
                    const editedAtt = {
                        type: 'article',
                        link: link.url,
                        photo: {
                            ...link.photo,
                            sizes: [link.photo.sizes[0], link.photo.sizes[link.photo.sizes.length - 1]]
                        },
                    };
                    mapdAttachs.push(editedAtt)
                }
                break;
            default:
                mapdAttachs.push(att)
        }
    }
    return getImg ? mapdAttachs.filter(img => !!img && typeof(img) === 'string') : mapdAttachs
}

const getImgLinkFromAttach = attach => {
    let link = '';
    if (attach) {
        if (attach.photo) {
            if (attach.photo.sizes && attach.photo.sizes[1]) {
                link = attach.photo.sizes[1].url
            }
        } else if (attach.video) {
            if (attach.video.image && attach.video.image.length) {
                const defimg = attach.video.image.find(im => im.width === 720)
                link = defimg ? defimg.url : attach.video.image[0].url
            }
        }
    }
    return link;
}
//mod()
module.exports = mod

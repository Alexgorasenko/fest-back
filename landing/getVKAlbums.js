const service = require('../../service')
const ObjectId = require('mongoose').Types.ObjectId
const moment = require('moment')
const axios = require('axios')

const base = 'https://api.vk.com/method/';
const vers = '5.194';

const getVKPhotosById = async (access, remoteId, photoId) => {
    const url = `${base}photos.getById?access_token=${access}&photos=-${remoteId}_${photoId}&v=${vers}`;
    const data = await axios.get(url);
    if (data.data.response && data.data.response.length) {
        const sizes = data.data.response[0].sizes.sort((a, b) => +a.width > +b.width ? 1 : -1);
        return {id: photoId, sizes: [sizes[0], sizes[sizes.length - 1]]}
    } else {
        return null
    }
}

const getVKPhotosByAlbumId = async (access, owner_id, album_id, count=50) => {
    //console.log('getVKPhotosByAlbumId', album_id, count);
    const url = `${base}photos.get?access_token=${access}&owner_id=${owner_id}&album_id=${album_id}&count=${count}&v=${vers}`;
    const data = await axios.get(url);
    if (data.data.response) {
        const { response } = data.data;
        //console.log('count', count, 'items.length', response.items.length);

        const mapd = response.items.map(item => (
            {
                type: 'photo',
                photo: {
                id: item.id,
                sizes: item.sizes.sort((a, b) => +a.width > +b.width ? 1 : -1).filter((item, ind, arr) => ind === 0 || ind === arr.length -1)
            }}
        ));
        return mapd
    } else {
        return null
    }
}

module.exports = async (social, albumId=null) => {
    try {
        const { access, remoteId, vkAppId, remoteName='lflvoronezh' } = social;
        const startDateUnix = moment().add(-7, 'days').unix();
        const url = `${base}photos.getAlbums?access_token=${access}&owner_id=-${remoteId}&v=${vers}`;
        const data = await axios.get(url);
        if (data.data && data.data.response) {
            const { items, count } = data.data.response;

            const filtredItems = albumId ? items.filter(item => item.id === albumId) : items.filter(item => item.created >= startDateUnix && !!item.size && !!item.thumb_id && item.title && item.title !== 'Личные фотографии'); // || item.updated < startDateUnix
            const mapd = []
            for( let item of filtredItems) {
                //console.log('item', item);
                const preview = await getVKPhotosById(access, remoteId, item.thumb_id);
                const photos = albumId ? await getVKPhotosByAlbumId(access, item.owner_id, item.id, item.size) : [{type: 'album', album: {...item, thumb: preview}}]
                const { description, created, ...rest} = item;
                mapd.push({
                    ...rest,
                    date: moment(created, 'X').format('YY-MM-DD'),
                    category: 'photos',
                    type: 'album',
                    preview: preview,
                    text: description || '',
                    attachments: photos
                })
            }
            return albumId ? mapd[0] : mapd
        } else {
            return albumId ? null : []
        }

    } catch (e) {
        console.log('module getVKAlbums faild', e);
        return [] //{error: true, msg: 'method faild'}
    }
}

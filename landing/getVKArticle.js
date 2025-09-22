const service = require('../../service')
const ObjectId = require('mongoose').Types.ObjectId
const moment = require('moment')
const axios = require('axios')
const striptags = require('striptags');

const checkedTags = [
    '<div class="article_figure_content"',
    '<div class="article_figure_sizer"'
]

module.exports = async (url) => {
    try {
        const data = await axios.get(url);
        //console.log('ARTICLE data', data.data, url);
        if (data.data) {
            const artDataFull = '<div class="article article_view' + data.data.split('<div class="article article_view')[1];
            const artData = artDataFull.split('<noscript>')[0].split('<script type="text')[0]
            //console.log('artData', artData, url);
            const stripted = striptags(artData, ['div', 'img', 'p', 'a']); //
            const artDataCut = stripted.split('{"@context"');
            const outArtData = artDataCut[1] ? artDataCut[0] + '<' + artDataCut[1].split('}<')[1] : artDataCut[0]
            //const strip = striptags(stripted, 'div', 'div');
            // const regex = /style/ig;
            // const strip = stripted.replace(regex,'styleoff')

            const withoutFooter = outArtData.split('<div class="articleView__footer_btn">')[0] + '</div>';
            const mappedHTML = mappedDivs(withoutFooter)
            //console.log('artData strip', mappedHTML);
            //console.log('outArtData', mappedHTML);

            return mappedHTML;
        } else {
            return null
        }

    } catch (e) {
        console.log('module getVKArticle faild', e);
        return null //{error: true, msg: 'method faild'}
    }
}

const mappedDivs = htmlText => {
    const trashAttrs = ['style="', 'data-sizes="', 'onclick="', 'class="', 'data-article-id="'];
    let out = htmlText;

    for (let attr of trashAttrs) {
        const arr = out.split(attr);
        const mapd = arr.slice(1).map(wrongTag => wrongTag.split('"').slice(1).join('"')).join('');
        out = arr[0] + mapd;
    }
    const cuted = out.split('<div></div>').join('').split('<div  ></div>').join('').split('<div ></div>').map(ddiv => ddiv.trim()).join('');
    return cuted
}

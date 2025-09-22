const puppeteer = require('puppeteer')
const { getObjId, decodePublicUserToken } = require('./utils')
const service = require('./service')
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000
const portOffset = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0
const actualPort = port + portOffset

module.exports = async (req, res) => {
    const { url } = req.body
    if(url) {
        try {
            const doc = await renderDoc(`http://localhost:${actualPort}/${url}`)
            res.setHeader('Content-Disposition', 'attachment; filename=' + 'Football_In_School_Application.pdf')
            res.setHeader('Content-Transfer-Encoding', 'binary')
            res.setHeader('Content-Type', 'application/octet-stream')
            res.send(doc)

            if (url.includes('print/formQuery')) {
                const queryUrl = url.split('/');
                const queryId = getObjId(queryUrl[queryUrl.length-1]);
                if (queryId ) {
                    const authorization = req.headers.authorization || req.headers.Authorization || null;
                    if ( authorization ) {
                        const signer = decodePublicUserToken(authorization);
                        if (signer && signer.uid && getObjId(signer.uid)) {
                            const query = await service.fetch({collection: 'queries', pipeline: [
                                {$match: {
                                    _id: queryId,
                                    userId: getObjId(signer.uid)
                                }}
                            ], asEntry: true});
                            if (query && !query.isPrintFormGetted) {
                                await service.update({collection: 'queries', _id: queryId}, {isPrintFormGetted: true})
                            }
                        }
                    }
                }
            } else if (url.includes('print/getaActivitiesWithReports')) {
                const queryUrl = url.split('/');
                let queryId = null

                if (queryUrl[queryUrl.length-1]) {
                    if (queryUrl[queryUrl.length-1].includes('?')) {
                        queryId = getObjId(queryUrl[queryUrl.length-1].split('?')[0]);
                    } else {
                        queryId = getObjId(queryUrl[queryUrl.length-1]);
                    }
                }
                if (queryId ) {
                    const authorization = req.headers.authorization || req.headers.Authorization || null;
                    if ( authorization ) {
                        const signer = decodePublicUserToken(authorization);
                        if (signer && signer.uid && getObjId(signer.uid)) {
                            const query = await service.fetch({collection: 'queries', pipeline: [
                                {$match: {
                                    _id: queryId,
                                    //userId: getObjId(signer.uid)
                                }}
                            ], asEntry: true});
                            if (query ) {
                                let nominationId = null

                                if (queryUrl[queryUrl.length-1].includes('?')) {
                                    nominationId = getObjId(queryUrl[queryUrl.length-1].split('?')[1].replace('nominationId=',''));
                                }
                                console.log('nominationId', nominationId);
                                if (nominationId) {
                                    if (!query.finishedReports) {
                                        await service.update({collection: 'queries', _id: queryId}, {finishedReports: {[nominationId]: true}})
                                    } else if (!query.finishedReports[nominationId]) {
                                        await service.update({collection: 'queries', _id: queryId}, {[(`finishedReports.${nominationId}`)]: true})
                                    }
                                }

                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log('render failed, url: ', url, e)
            res.status(500).json({success: false, message: 'Internal server error'})
        }
    } else {
        res.status(404).json({success: false, message: 'Malformed render URL'})
    }
}

const renderDoc = async url => {
    return new Promise((resolve, reject) => {
        try {
            puppeteer.launch({
                args: ['--no-sandbox', `--window-size=1920,1080`],
                defaultViewport: null
            }).then(async browser => {
                    let page = (await browser.pages())[0]
                    await page.goto(url)
                    await page.waitForTimeout(500)
                    const pdf = await page.pdf({
                        format: 'A4',
                        landscape: true,
                        margin: {
                            left: 0,
                            top: 0,
                            right: 0,
                            bottom: 0
                        },
                        scale: .9,
                        preferCSSPageSize: false
                    })
                    await page.waitForTimeout(1000)
                    await browser.close()
                    resolve(pdf)
                })
        } catch (e) {
            console.log(e)
            reject()
        }
    })
}

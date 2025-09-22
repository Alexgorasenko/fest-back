const dgram = require('node:dgram');
const moment = require('moment');
//sender_udp_message({ _id: 15415, collection: 'userssss', userId: 1515, action: 'remove', role: 'seperviser' })

module.exports = async (message) => {
    // if (!message || !message._id || !message.collection || !message.userId || !message.action) {
    //     console.log('некорректное сообщение', message)
    //     return {success: false, msg: 'Нет данных для загрузки', errorStatus: 400}
    // }

    //const { _id, collection, userId, action, role } = message

    //<34>1 2022-08-18T10:14:15.003Z machine.example.com su - ID47 - BOM'su root' failed for lonvick on /dev/pts/8
    if (process.env.DB_INSTANCE && process.env.DB_INSTANCE === 'school_fest') {
        const selfHost = "api-fests.rfs.ru"
        let messageOut = `6 ${selfHost} ${message}`;

        try {
            const client = dgram.createSocket('udp4');

            const buf = Buffer.from(messageOut)
            console.log('message', buf, buf.length, messageOut);
            //client.send(buf, 0, buf.length, 5142, "178.177.5.15", (err, bytes) => {
            client.send(buf, 5146, '178.177.5.15', (err, bytes) => {
                if (err) {
                    console.log("Unable to send message. Error:" + err.message, err);
                } else {
                    console.log("Metrics are uploaded to server. Sent bytes:", bytes);
                }

                client.close();
            });

            return {
                success: true,
            }
        } catch (e) {
            console.log('send message failed', e);
            return {success: false, msg: 'send message failed', errorStatus: 501}
        }
    } else {
        return {
            success: true,
        }
    }
}
/*
Источник:
1 – user –  Сообщения пользовательских программ
2 – mail –  Сообщения от почтовой системы.
3 – daemon – Сообщения от тех системных демонов, которые в отличие от FTP или LPR не имеют выделенных специально для них категорий.
4 – auth – Все что связано с авторизацией пользователей, вроде login и su (безопасность/права доступа)
*/
/*
приоритет:
0 – emerg (старое название PANIC) – Чрезвычайная ситуация. Система неработоспособна.
1 – alert – Тревога! Требуется немедленное вмешательство.
2 – crit – Критическая ошибка (критическое состояние).
3 – err (старое название ERROR) – Сообщение об ошибке.
4 – warning (старое название WARN) – Предупреждение.
5 – notice – Информация о каком-то нормальном, но важном событии.
6 – info – Информационное сообщение.
*/

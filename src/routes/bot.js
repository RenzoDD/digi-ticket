const MySQL = require('../utilities/mysql');
const BackUp = require('../utilities/backup');

const DigiByte = require('digibyte-js');
const HDPrivateKey = require('digibyte-js/lib/hdprivatekey');
const Script = require('digibyte-js/lib/script/script');
const Transaction = require('digibyte-js/lib/transaction/transaction');
const Explorer = require('digibyte-js/lib/explorer');

const express = require('express');
const router = express.Router();

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM, { polling: true });

async function LinearStateBot(message, data) {
    var TelegramID = message.chat.id;

    var telegram = await MySQL.Query("CALL Telegram_Create(?)", [TelegramID]);
    telegram = telegram[0];

    var user = await MySQL.Query("CALL Users_Read_TelegramID(?)", [TelegramID]);

    if (user.length != 1)
        return bot.sendMessage(TelegramID, `Hello. We don't have your account registered. Please login and link your Telegram account with this code: '${telegram.Token}'.\nhttps://digiticket.net.pe/login`);
    user = user[0];

    if (user.Type != 1)
        return bot.sendMessage(TelegramID, `This channel is only for clients. Please, login to manage the system.\nhttps://digiticket.net.pe/login`);

    var Information = JSON.parse(telegram.Information);

    if (message.text == "/start")
        Information = {};

    if (!Information.status)
        Information.status = "resting";

    switch (Information.status) {
        case "resting":
            var options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Create a ticket', callback_data: 'create-ticket' },
                            { text: 'Answered tickets', callback_data: 'check-inbox' },
                        ],
                    ],
                },
            };

            Information.status = "select-option"
            await MySQL.Query("CALL Telegram_Update_Information(?,?)", [TelegramID, JSON.stringify(Information)]);
            return bot.sendMessage(TelegramID, `Hello ${user.Name}. What do you want to do? You can use /start to restart the chat`, options);

        case "select-option":
            if (data === null)
                return bot.sendMessage(TelegramID, `Please, select one of the options above.`);


            if (data === "create-ticket") {

                var deparments = await MySQL.Query("CALL Deparments_Read_All()")

                var keyboard = [];
                for (var deparment of deparments) {
                    var size = keyboard.length;
                    if (size === 0) {
                        keyboard.push([]);
                        size = keyboard.length;
                    }
                    if (keyboard[size - 1].length === 2)
                        keyboard.push([]);
                    keyboard[size - 1].push({ text: deparment.Name, callback_data: "deparment-" + deparment.DeparmentID })
                }

                var options = {
                    reply_markup: {
                        inline_keyboard: keyboard
                    }
                };

                Information.status = "select-deparment";
                await MySQL.Query("CALL Telegram_Update_Information(?,?)", [TelegramID, JSON.stringify(Information)]);
                return bot.sendMessage(TelegramID, `Which deparment you want to submit the ticket?`, options);
            } else if (data === "check-inbox") {
                var data = await MySQL.Query("CALL Tickets_Read_Status(?)", [4])
                var { Quantity } = data[0];

                Information.status = "resting";
                await MySQL.Query("CALL Telegram_Update_Information(?,?)", [TelegramID, JSON.stringify(Information)]);
                return bot.sendMessage(TelegramID, `You have ${Quantity} answered tickets. Please, use /start to resume the chat`);
            }
            break;

        case "select-deparment":
            if (data === null)
                return bot.sendMessage(TelegramID, `Please, select one of the deparments above.`);
            else if (!data.startsWith("deparment-"))
                return bot.sendMessage(TelegramID, `Please, select one of the deparments above.`);
            else
                data = parseInt(data.replace("deparment-", ""));

            var deparment = await MySQL.Query("CALL Deparments_Read_DeparmentID(?)", [parseInt(data)]);

            if (deparment.length !== 1)
                return bot.sendMessage(TelegramID, `Invalid deparment. Try again`);

            Information.DeparmentID = deparment[0].DeparmentID;
            Information.status = "tell-subject";
            await MySQL.Query("CALL Telegram_Update_Information(?,?)", [TelegramID, JSON.stringify(Information)]);
            return bot.sendMessage(TelegramID, `In a single sentence. What's your issue/request?`);

        case "tell-subject":
            if (message.text.length == 0)
                return bot.sendMessage(TelegramID, `Invalid response`);
            if (message.text.length <= 10)
                return bot.sendMessage(TelegramID, `Your response must be a little bit longer`);

            Information.Subject = message.text;
            Information.status = "tell-issue";
            await MySQL.Query("CALL Telegram_Update_Information(?,?)", [TelegramID, JSON.stringify(Information)]);
            return bot.sendMessage(TelegramID, `Please elaborate your issue/request. Your message can be as long as you need.`);

        case "tell-issue":
            if (message.text.length == 0)
                return bot.sendMessage(TelegramID, `Invalid response`);
            if (message.text.length <= 10)
                return bot.sendMessage(TelegramID, `Your response must be a little bit longer`);

            var ticket = await MySQL.Query("CALL Tickets_Create(?,?,?)", [user.UserID, Information.DeparmentID, Information.Subject]);
            ticket = ticket[0];

            /* Secure ticket start */
            var hdPrivateKey = new HDPrivateKey(process.env.XPRV);

            var gPrivateKey = hdPrivateKey.derive(`${process.env.HDER}/0/0`).privateKey;
            var gAddress = gPrivateKey.toAddress().toString();

            var ePrivateKey = hdPrivateKey.derive(`${process.env.HDER}/0/${ticket.TicketID}`).privateKey;
            var eAddress = ePrivateKey.toAddress().toString();
            console.log(`Generated eAddress: ${eAddress}`)

            var fTicket = BackUp.FormatTicket(ticket);
            var hTicket = BackUp.SHA256(fTicket);
            console.log(`Generated object: ${JSON.stringify(fTicket)}`)
            console.log(`Generated hash: ${hTicket.toString('hex')}`)

            var UTXOs = await BackUp.GetUTXOs(gAddress);

            var tx = new Transaction()
                .from(UTXOs)
                .to(eAddress, 600)
                .addData(hTicket)
                .change(gAddress)
                .sign(gPrivateKey);

            var hex = tx.serialize(true);

            var explorer = new Explorer(process.env.EXPLORER);
            for (var i = 0; i < 10; i++) {
                var data = await explorer.sendtx(hex);
                if (data.error) console.log(data.error);
                else break;
            }

            if (data.result) {
                console.log(`Broadcasted TX: ${data.result}`)

                BackUp.SaveUTXOs(eAddress, { txid: data.result, vout: 0, satoshis: 600, scriptPubKey: Script.fromAddress(eAddress).toHex() })
                BackUp.SaveUTXOs(gAddress, { txid: data.result, vout: 2, satoshis: tx.getChangeOutput().satoshis, scriptPubKey: Script.fromAddress(gAddress).toHex() })
            }
            /* Secure ticket end */

            var message = await MySQL.Query("CALL Messages_Create(?,?,?)", [ticket.TicketID, user.UserID, message.text]);
            message = message[0];

            /* Secure message start */
            var fMessage = BackUp.FormatMessage(message);
            var hMessage = BackUp.SHA256(fMessage);
            console.log(`Generated object: ${JSON.stringify(fMessage)}`)
            console.log(`Generated hash: ${hMessage.toString('hex')}`)

            var gUTXOs = await BackUp.GetUTXOs(gAddress);
            var eUTXOs = await BackUp.GetUTXOs(eAddress);

            var tx = new Transaction()
                .from(gUTXOs)
                .from(eUTXOs)
                .to(eAddress, 600)
                .addData(hMessage)
                .change(gAddress)
                .sign([gPrivateKey, ePrivateKey]);

            var hex = tx.serialize(true);

            var explorer = new Explorer(process.env.EXPLORER);
            for (var i = 0; i < 10; i++) {
                var data = await explorer.sendtx(hex);
                if (data.error) console.log(data.error);
                else break;
            }

            if (data.result) {
                console.log(`Broadcasted TX: ${data.result}`)

                BackUp.SaveUTXOs(eAddress, { txid: data.result, vout: 0, satoshis: 600, scriptPubKey: Script.fromAddress(eAddress).toHex() })
                BackUp.SaveUTXOs(gAddress, { txid: data.result, vout: 2, satoshis: tx.getChangeOutput().satoshis, scriptPubKey: Script.fromAddress(gAddress).toHex() })
            }
            /* Secure message end */

            Information = {};
            Information.status = "resting";
            await MySQL.Query("CALL Telegram_Update_Information(?,?)", [TelegramID, JSON.stringify(Information)]);
            return bot.sendMessage(TelegramID, `Your ticket #${ticket.TicketID} has been created. You can login to check the updates.`);
    }
}

bot.on('message', async (message) => {
    if (!message.text)
        message.text = "";

    const regex = /[\x00-\x1F\x7F-\x9F\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{1FAD0}-\u{1FAFF}]/gu;
    message.text = message.text.replace(regex, '');

    LinearStateBot(message, null);
});
bot.on('callback_query', async (query) => {
    query.message.text = "";
    LinearStateBot(query.message, query.data);
});

router.post('/', (req, res) => {
    const body = req.body;
    bot.processUpdate(body);
    res.sendStatus(200);
});

module.exports = router;
const crypto = require('crypto');
const fs = require('fs');

const MySQL = require('./mysql');


const DigiByte = require('digibyte-js');
const HDPrivateKey = require('digibyte-js/lib/hdprivatekey');
const Script = require('digibyte-js/lib/script/script');
const Transaction = require('digibyte-js/lib/transaction/transaction');
const Explorer = require('digibyte-js/lib/explorer');

async function GetUTXOs(address, override = false) {
    var path = __dirname + "/../utxos.json";
    var data = JSON.parse(fs.readFileSync(path));
    data[address] = data[address] ? data[address] : [];

    if (data[address].length === 0 || override) {
        var explorer = new Explorer(process.env.EXPLORER);
        data[address] = await explorer.utxo(address);
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    }

    return data[address];
}
function SaveUTXOs(address, utxos) {
    var path = __dirname + "/../utxos.json";
    var data = JSON.parse(fs.readFileSync(path));
    data[address] = utxos;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function SHA256(obj) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(obj));
    return hash.digest();
}

function GetWallet(n) {
    var hdPrivateKey = new HDPrivateKey(process.env.XPRV);

    var privateKey = hdPrivateKey.derive(`${process.env.HDER}/0/${n}`).privateKey;
    var address = privateKey.toAddress().toString();

    return { wif: privateKey.toWIF(), address };
}
async function GetTXs(TicketID) {
    var { address } = GetWallet(TicketID);

    var explorer = new Explorer(process.env.EXPLORER);
    var data = await explorer.address(address, { details: "txs" });

    return data.transactions;
}

async function SaveIPFS(data) {
    const ipfsClient = await import('ipfs-http-client');
    const client = ipfsClient.create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: 'Basic ' + Buffer.from(`${process.env.UIPFS}:${process.env.KIPFS}`).toString('base64')
        }
    });

    var result = await client.add(JSON.stringify(data), { rawLeaves: true });
    return result.cid;
}

async function SaveTicket(TicketID) {
    try {
        var db = await MySQL.Query("CALL Tickets_Read_TicketID(?)", [TicketID]);

        var ticket = {};
        ticket.TicketID = db[0].TicketID;
        ticket.ClientID = db[0].ClientID;
        ticket.Impact = db[0].Impact;
        ticket.DownTime = db[0].DownTime;
        ticket.Priority = db[0].Priority;
        ticket.Subject = db[0].Subject;
        ticket.Creation = db[0].Creation;
        console.log(`Generated object: ${JSON.stringify(ticket)}`)

        var { wif, address } = GetWallet(0);
        var gPrivateKey = wif;
        var gAddress = address;
        console.log(`Generated gAddress: ${gAddress}`);

        var { address } = GetWallet(ticket.TicketID);
        var eAddress = address;
        console.log(`Generated eAddress: ${eAddress}`);

        var hash = SHA256(ticket);
        console.log(`Generated hash: ${hash.toString('hex')}`)

        var UTXOs = await GetUTXOs(gAddress);

        var tx = new Transaction()
            .from(UTXOs)
            .to(eAddress, 600)
            .addData(hash)
            .change(gAddress)
            .sign(gPrivateKey);

        var hex = tx.serialize(true);

        var explorer = new Explorer(process.env.EXPLORER);
        for (var i = 0; i < 10; i++) {
            var data = await explorer.sendtx(hex);
            if (data.error) console.log(data.error);
            else break;
        }

        if (data.error)
            return false;

        console.log(`Broadcasted TX: ${data.result}`);

        SaveUTXOs(eAddress, [{ txid: data.result, vout: 0, satoshis: 600, scriptPubKey: Script.fromAddress(eAddress).toHex() }]);
        SaveUTXOs(gAddress, [{ txid: data.result, vout: 2, satoshis: tx.getChangeOutput().satoshis, scriptPubKey: Script.fromAddress(gAddress).toHex() }]);

        var cid = await SaveIPFS(ticket);
        console.log(`Saved on IPFS: ${cid}`);

        return data.result;
    } catch (e) {
        console.log("SaveTicket error");
        return false;
    }
}
async function SaveMessage(MessageID) {
    try {
        var db = await MySQL.Query("CALL Messages_Read_MessageID(?)", [MessageID]);

        var message = {};
        message.MessageID = db[0].MessageID;
        message.TicketID = db[0].TicketID;
        message.UserID = db[0].UserID;
        message.Text = db[0].Text;
        message.Creation = db[0].Creation;
        console.log(`Generated object: ${JSON.stringify(message)}`)

        var { wif, address } = GetWallet(0);
        var gPrivateKey = wif;
        var gAddress = address;
        console.log(`Generated gAddress: ${gAddress}`);

        var { wif, address } = GetWallet(message.TicketID);
        var ePrivateKey = wif;
        var eAddress = address;
        console.log(`Generated eAddress: ${eAddress}`)

        var hash = SHA256(message);
        console.log(`Generated hash: ${hash.toString('hex')}`)

        var gUTXOs = await GetUTXOs(gAddress);
        var eUTXOs = await GetUTXOs(eAddress);

        var tx = new Transaction()
            .from(gUTXOs)
            .from(eUTXOs)
            .to(eAddress, 600)
            .addData(hash)
            .change(gAddress)
            .sign([gPrivateKey, ePrivateKey]);

        var hex = tx.serialize(true);

        var explorer = new Explorer(process.env.EXPLORER);
        for (var i = 0; i < 10; i++) {
            var data = await explorer.sendtx(hex);
            if (data.error) console.log(data.error);
            else break;
        }

        if (data.error)
            return false;

        console.log(`Broadcasted TX: ${data.result}`)

        SaveUTXOs(eAddress, [{ txid: data.result, vout: 0, satoshis: 600, scriptPubKey: Script.fromAddress(eAddress).toHex() }])
        SaveUTXOs(gAddress, [{ txid: data.result, vout: 2, satoshis: tx.getChangeOutput().satoshis, scriptPubKey: Script.fromAddress(gAddress).toHex() }])

        var cid = await SaveIPFS(message);
        console.log(`Saved on IPFS: ${cid}`);

        return data.result;
    } catch (e) {
        console.log("SaveMessage error");
        return false;
    }
}

async function CheckTicket(ticket, tx) {
    if (!tx) return false;

    var tck = {};
    tck.TicketID = ticket.TicketID;
    tck.ClientID = ticket.ClientID;
    tck.Impact = ticket.Impact;
    tck.DownTime = ticket.DownTime;
    tck.Priority = ticket.Priority;
    tck.Subject = ticket.Subject;
    tck.Creation = ticket.Creation;

    var hash = SHA256(tck).toString('hex').toUpperCase();
    var op_return = tx.vout[1].hex.toUpperCase();

    var result = op_return.indexOf(hash) !== -1;

    if (!result) {
        const TelegramBot = require('node-telegram-bot-api');
        const bot = new TelegramBot(process.env.TELEGRAM);
        var admins = await MySQL.Query('CALL Users_Read_DeparmentID_Type(?,?)', [ticket.DeparmentID, 3]);
        for (var admin of admins)
            if (admin.TelegramID)
                await bot.sendMessage(admin.TelegramID, `Hello ${admin.Name}, we have detected an integrity error on ticket #${tck.TicketID}`);
    }

    return result;
}
async function CheckMessage(message, tx) {
    if (!tx) return false;

    var msg = {};
    msg.MessageID = message.MessageID;
    msg.TicketID = message.TicketID;
    msg.UserID = message.UserID;
    msg.Text = message.Text;
    msg.Creation = message.Creation;

    var hash = SHA256(msg).toString('hex').toUpperCase();
    var op_return = tx.vout[1].hex.toUpperCase();

    var result = op_return.indexOf(hash) !== -1;

    if (!result) {
        const TelegramBot = require('node-telegram-bot-api');
        const bot = new TelegramBot(process.env.TELEGRAM);
        var ticket = await MySQL.Query('CALL Tickets_Read_TicketID(?)', [msg.TicketID]);
        var admins = await MySQL.Query('CALL Users_Read_DeparmentID_Type(?,?)', [ticket[0].DeparmentID, 3]);
        for (var admin of admins)
            if (admin.TelegramID)
                await bot.sendMessage(admin.TelegramID, `Hello ${admin.Name}, we have detected an integrity error on message #${msg.MessageID} from ticket #${msg.TicketID}`);
    }

    return result;
}

async function CheckIntegrity() {
    var explorer = new Explorer(process.env.EXPLORER);

    var tickets = await MySQL.Query("CALL Tickets_Read_All()");
    for (var ticket of tickets) {
        var { transactions } = await explorer.address(GetWallet(ticket.TicketID).address, { details: 'txs' });
        var messages = await MySQL.Query("CALL Messages_Read_TicketID(?)", [ticket.TicketID]);

        CheckTicket(ticket, transactions.find(x => x.txid == ticket.TXID));
        for (var message of messages)
            CheckMessage(message, transactions.find(x => x.txid == message.TXID));
    }
}

module.exports = { GetWallet, GetTXs, SaveTicket, SaveMessage, CheckTicket, CheckMessage, CheckIntegrity }
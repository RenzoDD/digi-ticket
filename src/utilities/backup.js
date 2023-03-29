const crypto = require('crypto');
const fs = require('fs');

const Explorer = require('digibyte-js/lib/explorer');

function FormatTicket(raw) {
    var ans = {};
    ans.TicketID = raw.TicketID;
    ans.ClientID = raw.ClientID;
    ans.Subject = raw.ClientID;
    ans.Creation = raw.ClientID;
    return ans;
}
function FormatMessage(raw) {
    var ans = {};
    ans.MessageID = raw.MessageID;
    ans.TicketID = raw.TicketID;
    ans.UserID = raw.UserID;
    ans.Text = raw.Text;
    ans.Creation = raw.Creation;
    return ans;
}

function SHA256(obj) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(obj));
    return hash.digest();
}

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

module.exports = { FormatTicket, FormatMessage, SHA256, GetUTXOs, SaveUTXOs }
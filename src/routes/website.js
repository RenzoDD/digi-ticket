const MySQL = require('../utilities/mysql');
const { SaveTicket, SaveMessage, GetTXs, CheckMessage, CheckTicket, Restore, GetWallet } = require('../utilities/blockchain');


const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM);

const express = require('express');
const router = express.Router();

global.states = {
    "format-1": "primary", "format-2": "primary", "format-3": "success", "format-4": "warning", "format-5": "secondary",
    1: "Created", 2: "Assigned", 3: "Aswered", 4: "Replied", 5: "Closed",
    "Created": 1, "Assigned": 2, "Aswered": 3, "Replied": 4, "Closed": 5
}
global.types = {
    1: "User", 2: "Employee", 3: "Admin", 4: "Managment",
    "User": 1, "Employee": 2, "Admin": 3, "Managment": 4
}

// Home
router.get('/', async function (req, res) {
    res.render("home", { code: "/home", session: req.session });
});

// Login
router.get('/login', async function (req, res) {
    res.render("login", { code: "/login", session: req.session });
});
router.post('/login', async function (req, res) {
    if (req.session.user)
        return res.redirect('/error/login/already-in');

    var user = await MySQL.Query("CALL Users_Login(?,?)", [req.body.email, req.body.password]);

    if (user.length != 1)
        return res.redirect('/error/login/invalid-credentials');

    req.session.user = user[0];
    return res.redirect('/');
});
router.get('/logout', async function (req, res) {
    delete req.session.user;
    return res.redirect('/login');
});

// Tickets
router.get('/tickets', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/tickets/not-logged-in");

    if (req.session.user.Type === global.types.User) {
        var deparments = await MySQL.Query("CALL Deparments_Read_All()");
        var tickets = await MySQL.Query("CALL Tickets_Read_ClientID(?)", [req.session.user.UserID]);
    } else if (req.session.user.Type === global.types.Employee) {
        var tickets = await MySQL.Query("CALL Tickets_Read_SupportID(?)", [req.session.user.UserID]);
    } else if (req.session.user.Type === global.types.Admin) {
        var tickets = await MySQL.Query("CALL Tickets_Read_Assigned_DeparmentID(?)", [req.session.user.DeparmentID]);
    }
    return res.render("tickets", { code: "/tickets", title: "Ticket's list", session: req.session, deparments, tickets });
});
// Create ticket
router.post('/create', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/create/not-logged-in");

    if (req.session.user.Type !== global.types.User)
        return res.redirect("/error/create/not-user");

    var ticket = await MySQL.Query("CALL Tickets_Create(?,?,?,?,?,?)", [req.session.user.UserID, req.body.deparment, parseInt(req.body.impact), parseInt(req.body.downtime), parseInt(req.body.priority), req.body.subject]);
    ticket = ticket[0];
    var txid = await SaveTicket(ticket.TicketID);
    if (txid) await MySQL.Query("CALL Tickets_Update_TXID(?,?)", [ticket.TicketID, txid]);

    var message = await MySQL.Query("CALL Messages_Create(?,?,?)", [ticket.TicketID, req.session.user.UserID, req.body.message]);
    message = message[0];
    var txid = await SaveMessage(message.MessageID);
    if (txid) await MySQL.Query("CALL Messages_Update_TXID(?,?)", [message.MessageID, txid]);

    var user = await MySQL.Query("CALL Users_Read_DeparmentID_Type(?,?)", [req.body.deparment, 3]);
    if (user[0].TelegramID) bot.sendMessage(user[0].TelegramID, `Hello ${user[0].Name}, the ticket #${ticket.TicketID} is ready to be assigned!`);

    return res.redirect("/tickets");
});

// Ticket
router.get('/ticket/:id', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/ticket/not-logged-in");

    var ticket = await MySQL.Query("CALL Tickets_Read_TicketID(?)", [req.params.id])
    ticket = ticket[0];

    if (req.session.user.UserID !== ticket.ClientID && req.session.user.UserID !== ticket.SupportID && req.session.user.Type !== 3)
        return res.redirect("/error/ticket/not-involved");

    var ticket = await MySQL.Query("CALL Tickets_Read_TicketID(?)", [req.params.id])
    ticket = ticket[0];

    var messages = await MySQL.Query("CALL Messages_Read_TicketID(?)", [ticket.TicketID])

    var txs = await GetTXs(ticket.TicketID);
    var tx = txs.filter(x => x.txid == ticket.TXID);
    ticket.Secured = await CheckTicket(ticket, tx[0]);

    for (var message of messages) {
        var tx = txs.filter(x => x.txid == message.TXID);
        message.Secured = await CheckMessage(message, tx[0]);
    }

    var deparments = await MySQL.Query("CALL Deparments_Read_All()")
    var employees = await MySQL.Query("CALL Users_Read_DeparmentID(?)", [req.session.user.DeparmentID])

    return res.render("ticket", { code: "/tickets", session: req.session, ticket, messages, deparments, employees });
});
// Answer ticket
router.post('/answer', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/answer/not-logged-in");

    var ticket = await MySQL.Query("CALL Tickets_Read_TicketID(?)", [req.body.ticket])
    ticket = ticket[0];

    if (req.session.user.UserID !== ticket.ClientID && req.session.user.UserID !== ticket.SupportID)
        return res.redirect("/error/answer/not-involved");

    var message = await MySQL.Query("CALL Messages_Create(?,?,?)", [ticket.TicketID, req.session.user.UserID, req.body.message]);
    message = message[0];
    var txid = await SaveMessage(message.MessageID);
    if (txid) await MySQL.Query("CALL Messages_Update_TXID(?,?)", [message.MessageID, txid]);

    if (req.session.user.Type === global.types.User) {
        if (ticket.Status !== global.states.Created && ticket.Status !== global.states.Assigned) {
            await MySQL.Query("CALL Tickets_Update_Status(?,?)", [ticket.TicketID, global.states.Replied]);
            var user = await MySQL.Query("CALL Users_Read_UserID(?)", [ticket.SupportID]);
            if (user[0].TelegramID) bot.sendMessage(user[0].TelegramID, `Hello ${user[0].Name}, the ticket #${ticket.TicketID} has been replied!`);
        }
    } else {
        await MySQL.Query("CALL Tickets_Update_Status(?,?)", [ticket.TicketID, global.states.Aswered]);
        var user = await MySQL.Query("CALL Users_Read_UserID(?)", [ticket.ClientID]);
        if (user[0].TelegramID) bot.sendMessage(user[0].TelegramID, `Hello ${user[0].Name}, your ticket #${ticket.TicketID} has been answered!`);
    }

    return res.redirect("/ticket/" + ticket.TicketID);
});
// Close ticket
router.post('/close', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/close/not-logged-in");

    var ticket = await MySQL.Query("CALL Tickets_Read_TicketID(?)", [req.body.ticket])
    ticket = ticket[0];

    if (req.session.user.UserID !== ticket.ClientID && req.session.user.UserID !== ticket.SupportID)
        return res.redirect("/error/close/not-involved");

    await MySQL.Query("CALL Tickets_Update_Status(?,?)", [ticket.TicketID, global.states.Closed])

    var user = await MySQL.Query("CALL Users_Read_DeparmentID_Type(?,?)", [ticket.DeparmentID, 3]);
    if (user[0].TelegramID) bot.sendMessage(user[0].TelegramID, `Hello ${user[0].Name}, the ticket #${ticket.TicketID} has been closed!`);

    return res.redirect("/ticket/" + ticket.TicketID);
});
// Rate ticket
router.post('/rate', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/rate/not-logged-in");

    var ticket = await MySQL.Query("CALL Tickets_Read_TicketID(?)", [req.body.ticket])
    ticket = ticket[0];

    if (req.session.user.UserID !== ticket.ClientID)
        return res.redirect("/error/rate/not-involved");

    await MySQL.Query("CALL Tickets_Update_Satisfaction(?,?)", [ticket.TicketID, req.body.points])

    return res.redirect("/ticket/" + ticket.TicketID);
});

// Assign list
router.get('/assign', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/assign/not-logged-in");
    if (req.session.user.Type !== global.types.Admin)
        return res.redirect("/error/assign/not-involved");

    var tickets = await MySQL.Query("CALL Tickets_Read_Unassigned_DeparmentID(?)", [req.session.user.DeparmentID]);

    return res.render("tickets", { code: "/assign", title: "Assign ticket", session: req.session, tickets });
});
// Assign ticket
router.post('/assign', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/assign/not-logged-in");
    if (req.session.user.Type !== global.types.Admin)
        return res.redirect("/error/assign/not-involved");

    var ticket = await MySQL.Query("CALL Tickets_Read_TicketID(?)", [req.body.ticket])
    ticket = ticket[0];

    await MySQL.Query("CALL Tickets_Update_SupportID(?,?)", [ticket.TicketID, req.body.employee]);
    if (ticket.Status === global.states.Created)
        await MySQL.Query("CALL Tickets_Update_Status(?,?)", [ticket.TicketID, global.states.Assigned])

    var user = await MySQL.Query("CALL Users_Read_UserID(?)", [req.body.employee]);
    if (user[0].TelegramID) bot.sendMessage(user[0].TelegramID, `Hello ${user[0].Name}, you have been assigned to the ticket #${ticket.TicketID}!`);

    return res.redirect("/ticket/" + req.body.ticket);
});
// Change ticket deparment
router.post('/deparment', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/deparment/not-logged-in");
    if (req.session.user.Type !== global.types.Admin)
        return res.redirect("/error/deparment/not-involved");

    await MySQL.Query("CALL Tickets_Update_DeparmentID(?,?)", [req.body.ticket, req.body.deparment]);

    var user = await MySQL.Query("CALL Users_Read_DeparmentID_Type(?,?)", [req.body.deparment, 3]);
    if (user[0].TelegramID) bot.sendMessage(user[0].TelegramID, `Hello ${user[0].Name}, the ticket #${ticket.TicketID} has been sent yo your deparment!`);

    return res.redirect("/tickets");
});

// Recovery
router.get('/recovery/:TicketID', async function (req, res) {
    var wallet = GetWallet(0);
    var txs = await GetTXs(req.params.TicketID);

    for (var tx of txs) {
        if (!tx.vin.find(x => x.addresses[0] == wallet.address))
            continue;
        var hash = tx.vout[1].hex.substr(4, 64);
        Restore(hash);
    }

    return res.redirect('/tickets');
});

// Service reports
router.get('/reports', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/reports/not-logged-in");
    if (req.session.user.Type !== global.types.Admin && req.session.user.Type !== global.types.Employee)
        return res.redirect("/error/reports/not-involved");

    var data = await MySQL.Query("CALL Reports_Tickets_Quantity(?)", [req.session.user.UserID]);
    var { Quantity } = data[0];

    var data = await MySQL.Query("CALL Reports_Tickets_Open(?)", [req.session.user.UserID]);
    var { Open } = data[0];

    var data = await MySQL.Query("CALL Reports_Tickets_Satisfaction(?)", [req.session.user.UserID]);
    var { Satisfaction } = data[0];

    var data = await MySQL.Query("CALL Reports_Tickets_Time(?)", [req.session.user.UserID]);
    var { Time } = data[0];

    var m = "days";
    Time /= 86400; // to days
    if (Time < 1) {
        var m = "hours";
        Time *= 24; // to hours
    }
    if (Time < 1) {
        var m = "minutes";
        Time *= 60; // to minutes
    }
    Time = Time.toFixed(0) + " " + m;

    return res.render('reports', { code: "/reports", session: req.session, Quantity, Open, Satisfaction, Time });
});

router.get('/account', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/reports/not-logged-in");
    return res.render('account', { code: "/account", session: req.session })
});
router.post('/telegram', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/telegram/not-logged-in");

    var user = await MySQL.Query("CALL Users_Read_UserID(?)", [req.session.user.UserID]);
    user = user[0];

    if (user.Telegram)
        return res.redirect("/error/telegram/already-connected");

    var telegram = await MySQL.Query("CALL Telegram_Read_Token(?)", [req.body.code]);
    if (telegram.length === 0)
        return res.redirect("/error/telegram/code-not-found");
    telegram = telegram[0];

    var user = await MySQL.Query("CALL Users_Update_Telegram(?,?)", [req.session.user.UserID, telegram.TelegramID]);
    req.session.user = user[0];

    if (!req.session.user.TelegramID)
        return res.redirect("/error/telegram/db-error");

    bot.sendMessage(req.session.user.TelegramID, `This user has been connected to ${req.session.user.Name} account. If this is a mistake contact DigiTicket support. To start chatting send /start.`);

    return res.redirect("/account");
});

module.exports = router;
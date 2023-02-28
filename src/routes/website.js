const MySQL = require('../utilities/mysql');

const express = require('express');
const router = express.Router();

// Home
router.get('/', async function (req, res) {
    var { motd } = require('../settings.json');
    res.render("home", { code: "/home", session: req.session, motd });
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

// Tickets
router.get('/tickets', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/login");
    var deparments = await MySQL.Query("CALL Deparments_Read_All()");
    var tickets = await MySQL.Query("CALL Tickets_Read_ClientID(?)", [req.session.user.UserID])
    res.render("tickets", { code: "/tickets", session: req.session, deparments, tickets });
});
// Create ticket
router.post('/create', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/login");

    var ticket = await MySQL.Query("CALL Tickets_Create(?,?,?)", [req.session.user.UserID, req.body.deparment, req.body.subject]);
    ticket = ticket[0]
    var message = await MySQL.Query("CALL Messages_Create(?,?,?,?)", [ticket.TicketID, req.session.user.UserID, null, req.body.message]);
    return res.redirect("/tickets");
});

module.exports = router;
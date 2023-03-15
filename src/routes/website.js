const MySQL = require('../utilities/mysql');

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

    var ticket = await MySQL.Query("CALL Tickets_Create(?,?,?)", [req.session.user.UserID, req.body.deparment, req.body.subject]);
    ticket = ticket[0];
    
    await MySQL.Query("CALL Messages_Create(?,?,?)", [ticket.TicketID, req.session.user.UserID, req.body.message]);
    
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

    await MySQL.Query("CALL Messages_Create(?,?,?)", [ticket.TicketID, req.session.user.UserID, req.body.message]);

    if (req.session.user.Type === global.types.User) {
        if (ticket.Status !== global.states.Created && ticket.Status !== global.states.Assigned)
            await MySQL.Query("CALL Tickets_Update_Status(?,?)", [ticket.TicketID, global.states.Replied])
    } else {
        await MySQL.Query("CALL Tickets_Update_Status(?,?)", [ticket.TicketID, global.states.Aswered])
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
    return res.redirect("/ticket/" + req.body.ticket);
});
// Change ticket deparment
router.post('/deparment', async function (req, res) {
    if (!req.session.user)
        return res.redirect("/error/deparment/not-logged-in");
    if (req.session.user.Type !== global.types.Admin)
        return res.redirect("/error/deparment/not-involved");

    await MySQL.Query("CALL Tickets_Update_DeparmentID(?,?)", [req.body.ticket, req.body.deparment]);

    return res.redirect("/tickets");
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

    return res.render('reports', { code: "/reports", session: req.session, Quantity, Open, Satisfaction });
});

module.exports = router;
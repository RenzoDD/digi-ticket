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

module.exports = router;
const express = require('express');
const router = express.Router();

// Home
router.get('/', async function (req, res) {
    var { motd } = require('../settings.json');
    res.render("home", { code: "/home", motd });
});

module.exports = router;
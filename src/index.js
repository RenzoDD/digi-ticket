require('dotenv').config()


const { GetWallet, CheckIntegrity } = require('./utilities/blockchain');

const express = require('express');
const app = express();
const session = require('express-session');

app.use(express.static(__dirname + '/assets'));
app.use(express.json());
app.use(express.urlencoded());
app.use(session({
    secret: 'digibyte rocks',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views')

app.use('/bot', require('./routes/bot'));
app.use('/', require('./routes/website'));

app.all('/error/:page/:name', async function (req, res) {
    var message = require('./error.json')[req.params.page][req.params.name];
    res.render('error', { code: "/login", session: req.session, message })
});

app.all('*', async function (req, res) {
    res.redirect('/');
});

app.listen(process.env.PORT, async function () {
    console.log(`--------------- Starting server ---------------`);
    console.log(`Time: ${new Date}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Address: ${GetWallet(0).address}`);
    console.log(`-----------------------------------------------`);
});

setInterval(CheckIntegrity, 10 * 60 * 1000);
CheckIntegrity()
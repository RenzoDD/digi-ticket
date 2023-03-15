require('dotenv').config()
console.log = function () {
    const fs = require('fs');
    var d = new Date,
        date = [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, "0"), d.getDate().toString().padStart(2, "0")].join('-'),
        time = [d.getHours().toString().padStart(2, "0"), d.getMinutes().toString().padStart(2, "0"), d.getSeconds().toString().padStart(2, "0")].join(':'),
        datetime = date + ' ' + time;

    var text = "";
    for (var arg in arguments) {
        if (typeof arguments[arg] == 'object')
            text += JSON.stringify(arguments[arg]);
        else
            text += arguments[arg];

        if (arg != arguments.length - 1)
            text += ' ';
        else
            text += '\n'
    }

    process.stdout.write(text);

    if (!fs.existsSync("./logs"))
        fs.mkdirSync("./logs");
    fs.appendFileSync("./logs/" + date + ".log", datetime + ": " + text);
};

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
    console.log(`-----------------------------------------------`);
});
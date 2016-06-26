var express = require('express')
    , app = express()
    , port = process.env.PORT || 8080
    , mongoose = require('mongoose')
    , passport = require('passport')
    , flash = require('connect-flash')
    , morgan = require('morgan')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , session = require('express-session')
    , configDB = require('./config/database.js');


mongoose.connect(configDB.url);

require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('static'));

app.set('view engine', 'pug');

app.use(session({secret: 'MonkeyTomeScantOliveDesicant'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);

app.listen(port);
console.log('Server running on port ' + port);

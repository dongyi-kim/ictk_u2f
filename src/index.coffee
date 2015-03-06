u2flib = require('u2f');
express = require('express');
session = require('express-session');

fs = require('fs');
http = require('http');
https = require('https');

bodyParser = require('body-parser');
cookieParser = require('cookie-parser');
methodOverride = require('method-override');

config = require('./config.js');

app = express();

https.createServer({key:fs.readFileSync('../key.pem'), cert: fs.readFileSync('../cert.pem')},app);
httpServer = http.createServer(app);

app.engine( 'ejs',require('ejs').__express )
app.set('view options', {layout : false})
app.use('/public', express.static(__dirname))
app.use('/bootstrap', express.static(__dirname + 'views/bootstrap'))


app.use(session({
  secret : 'keyboard cat',
  resave : true,
  saveUninitialized : true  })
)
app.use(methodOverride())

app.listen(443);
console.log('server open');

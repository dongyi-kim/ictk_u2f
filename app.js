var u2f = require('u2f');
var express = require('express');
var app = express();
var https = require('https');
var http = require('http');
var fs = require('fs');



app.engine('html', require('ejs').renderFile);



/* route urls */
//glboal function that redirect http request to https request
app.all('*', function(req, res, next){
	if(!req.secure)
	{
		return res.redirect('https://' + req.hostname  + req.url );
	}
	next();
});


app.get('/', function(req, res){
    res.render('index.ejs');
});



var https_options = {
  key: fs.readFileSync('asset/key.pem'),
  cert: fs.readFileSync('asset/cert.pem')
};
http.createServer(app).listen(80);
https.createServer(https_options, app).listen(443);

console.log('[!] Server activated.');

var u2flib = require('u2f');

var express = require('express');
var session = require('express-session');

var fs = require('fs');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');

//global constants
var config = require('./config.js');



/* App Setting */
var app = express();

var httpsServer = https.createServer({key:fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem')},app);
var httpServer = http.createServer(app);

//app.set('port',443);
app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});
//http://getbootstrap.com/javascript/

/* Directory Setting */
app.use('/public', express.static(__dirname));
app.use('/bootstrap', express.static(__dirname + '/views/bootstrap'));
app.use('/css', express.static(__dirname + '/views/css'));
app.use('/js', express.static(__dirname + '/views/js'));

//app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

//app.use(session({secret:'secret key', key:'fundoong', cookie : {maxAge:80*1000}}));
app.use(session());

//app.use(session());
app.use(methodOverride());



function u2f_send_request()
{
    var appId = config.APP_ID;
    var certificate = new Buffer("3082013c3081e4a003020102020a47901280001155957352300a06082a8648ce3d0403023017311530130603550403130c476e756262792050696c6f74301e170d3132303831343138323933325a170d3133303831343138323933325a3031312f302d0603550403132650696c6f74476e756262792d302e342e312d34373930313238303030313135353935373335323059301306072a8648ce3d020106082a8648ce3d030107034200048d617e65c9508e64bcc5673ac82a6799da3c1446682c258c463fffdf58dfd2fa3e6c378b53d795c4a4dffb4199edd7862f23abaf0203b4b8911ba0569994e101300a06082a8648ce3d0403020347003044022060cdb6061e9c22262d1aac1d96d8c70829b2366531dda268832cb836bcd30dfa0220631b1459f09e6330055722c8d89b7f48883b9089b88d60d1d9795902b30410df", 'hex');
    var clientData = '{"typ":"navigator.id.finishEnrollment","challenge":"vqrS6WXDe1JUs5_c3i4-LkKIHRr-3XVb3azuA5TifHo","cid_pubkey":{"kty":"EC","crv":"P-256","x":"HzQwlfXX7Q4S5MtCCnZUNBw3RMzPO9tOyWjBqRl4tJ8","y":"XVguGFLIZx1fXg3wNqfdbn75hi4-_7-BxhMljw42Ht4"},"origin":"http://example.com"}';
    var publicKey = new Buffer("04b174bc49c7ca254b70d2e5c207cee9cf174820ebd77ea3c65508c26da51b657c1cc6b952f8621697936482da0a6d3d3826a59095daf6cd7c03e2e60385d2f6d9", "hex");
    var keyHandle = new Buffer("2a552dfdb7477ed65fd84133f86196010b2215b57da75d315b7b9e8fe2e3925a6019551bab61d16591659cbaf00b4950f7abfe6660e2e006f76868b772d70c25", "hex");
    var registrationData = new Buffer("0504b174bc49c7ca254b70d2e5c207cee9cf174820ebd77ea3c65508c26da51b657c1cc6b952f8621697936482da0a6d3d3826a59095daf6cd7c03e2e60385d2f6d9402a552dfdb7477ed65fd84133f86196010b2215b57da75d315b7b9e8fe2e3925a6019551bab61d16591659cbaf00b4950f7abfe6660e2e006f76868b772d70c253082013c3081e4a003020102020a47901280001155957352300a06082a8648ce3d0403023017311530130603550403130c476e756262792050696c6f74301e170d3132303831343138323933325a170d3133303831343138323933325a3031312f302d0603550403132650696c6f74476e756262792d302e342e312d34373930313238303030313135353935373335323059301306072a8648ce3d020106082a8648ce3d030107034200048d617e65c9508e64bcc5673ac82a6799da3c1446682c258c463fffdf58dfd2fa3e6c378b53d795c4a4dffb4199edd7862f23abaf0203b4b8911ba0569994e101300a06082a8648ce3d0403020347003044022060cdb6061e9c22262d1aac1d96d8c70829b2366531dda268832cb836bcd30dfa0220631b1459f09e6330055722c8d89b7f48883b9089b88d60d1d9795902b30410df304502201471899bcc3987e62e8202c9b39c33c19033f7340352dba80fcab017db9230e402210082677d673d891933ade6f617e5dbde2e247e70423fd5ad7804a6d3d3961ef871", "hex");


    var result = {
        clientData: u2flib._toWebsafeBase64(new Buffer(clientData)),
        registrationData: u2flib._toWebsafeBase64(registrationData)
    };

    var request = u2flib.request(appId,function()
    {
        request.challenge = "vqrS6WXDe1JUs5_c3i4-LkKIHRr-3XVb3azuA5TifHo"; // We have a fixed challenge.
        console.log(' - request ended :' + request);

        var u2f_res = u2flib.checkRegistration(request, result);

        console.log(u2f_res);
        if(u2f_res.successful)
        {
            console.log('success');
        }else
        {
            console.log('fail');
        }
    });
    console.log(' - request send.');
}

app.get('*', function(req,res,next)
{
    console.log('app get *');
    if(!req.secure)
    {
        //redirect http to https
        return res.redirect('https://' + config.SERVER_URL + req.url);
    }
    next();
});

app.get('/', function(req,res)
{
    console.log(' - user access the index page ');
    res.render('./index.ejs', {});
});


// yubico u2f id-page
app.get('/u2f', function(req, res) {
    console.log(' - user access the u2f page');
    res.render('./u2f_index.ejs', { user_email : '' , req_Sign_up : false} );
    //res.end();
});

app.post('/u2f', function(req,res)
{
    //var u2f_req = u2f.request("http://www.kd2.kr");
    console.log(' - u2f page req');

    res.render('./u2f_index.ejs', {user_email : req.params.user_email, req_Sign_up : true }, u2f_send_request() );
    console.log(' - rendered.');
});

app.post('/login',function(req,res)
{

    res.end('<script> history.go(-1); </script>');
});
app.post('/validate',function(req,res)
{

    res.end('<script> history.go(-1); </script>');
});

/* Main Tab */
var arrTabMain = ['Home', 'Register', 'Contact', 'About'];

app.get('/main', function(req,res)
{
    if(!req.secure)
    {
        //redirect http to https
        return res.redirect('https://www.' + req.host + req.url);
    }
    console.log(' - access main page');
    var activeTab = req.query.tab;
    if(activeTab == null)
        activeTab = arrTabMain[0];
    res.render('./u2f_Home.ejs',{arrTab : arrTabMain, activeTab : activeTab, tryLogin : null, tryU2F:null });
});
app.post('/main', function(req,res){
    console.log(' - access main page with trying to log in');
    console.log(req.body);
    var tryU2F = (req.body['enroll-data'] == null);

    res.render('./u2f_Home.ejs',{arrTab : arrTabMain, activeTab : 'Home', tryLogin : true, tryU2F:tryU2F});
});


httpsServer.listen(443);
httpServer.listen(80);
console.log('Server open\n');

var u2f = require('u2f');
var http = require('http');
var express = require('express');
var app = express();

app.set('port',80);
app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});

/* Directory Setting */
app.use('/public', express.static(__dirname));
app.use('/bootstrap', express.static(__dirname + '/views/bootstrap'));
app.use('/css', express.static(__dirname + '/views/css'));
app.use('/js', express.static(__dirname + '/views/js'));



//app.all("*", function(req, res, next)
//{   //when user request
//    console.log(' ! user request');
//    next();
//
//    if(res.ended == true)
//        return;
//
//    console.log(' - user access the 404 page ');
//    res.render('404.ejs', {} );
//    res.end();
//    console.log(' request end');
//});

// yubico u2f id-page
app.get('/u2f', function(req, res) {
    console.log(' - user access the u2f page');
    res.render('./u2f_index.ejs', { user_email : '' , req_Sign_up : false} );
    //res.end();
});

//app.post('user_login', function(req,res){
//    console.log(JSON.stringify(req.body));
//    res.end();
//    //var user_email = req.body['user_email'];
//    //var user_passwd = req.body['user_passwd'];
//    //res.end('log in');
//});

app.post('/u2f/sign_up', function(req,res)
{
    console.log(' - user access the sign up page');

    res.render('./u2f_index.ejs', {user_email : req.params.user_email, req_Sign_up : true  });
    console.log(' - render');
    var u2f_req = u2f.request("http://www.kd2.kr");
    console.log(' - send req');

    var checkers = u2f.checkRegistration(u2f_req, res);
    if(checkers.successful)
    {
        console.log(' - success');
    }else
    {
        console.log(' - fail');
    }
    //res.end();

});

app.get('/', function(req,res)
{
    console.log(' - user access the index page ');

    res.end();

});

app.listen(80);
console.log('Server open\n');








//http.createServer(function (req, res) {
//
//    // Build the answer
//    var answer = "";
//    answer += "Request URL : " + req.url + "\n";
//    answer += "Reqeust type :" + req.method + "\n";
//    answer += "Request Header : " + JSON.stringify(req.headers) + "\n";
//
//
//    if( req.url == "/"){
//    	res.writeHead(200, { "Content-Type" : "text/html"});
//	    res.write('<script src=\"chrome-extension://pfboblefjcgdjicmnffhdgionmgcdmne/u2f-api.js\"></script>');
//    	res.end('Welcome index');
//    }else{
//    	res.writeHead(404, {"Content-Type" : "text/plain"});
//    	res.end("404 not found.\n");
//    }
//
//}).listen(80, '0.0.0.0');
//console.log('Server running at http://kd2.kr/');

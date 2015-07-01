var u2f = require('u2f');
var express = require('express');
var app = express();
var https = require('https');
var http = require('http');
var fs = require('fs');
var config = require('./config');	//configuration file with global constant 
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer'); 
var mysql = require('mysql');


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
app.engine('html', require('ejs').renderFile);
app.use(session({
  secret: 'some_secret_text',
  resave: false,
  saveUninitialized: true
}));


/* static routes path */
app.use("/js", express.static(__dirname + '/views/js'));

/* mysql db connect */
var connection = mysql.createConnection({
    host    :'localhost',
    port : 3306,
    user : config.DB_ID,
    password : config.DB_PW,
    database: config.DB_NAME
});



/* route urls */
//glboal function that redirect http request to https request
//u2f auth system only supports https 
app.all('*', function(req, res, next){
	if(!req.secure)
	{//if it's not https request redirect to https request
		return res.redirect('https://' + req.hostname  + req.url );
	}
	//if it's https request, just go next operation.
	next();
});

// index page. just render login page
app.get('/', function(req, res){
    res.render('index.ejs');
});

// first auth step, check invalidation of user's information 
app.post('/auth', function(req, res)
{
	//get user_id and user_pw from post data
	var user_id = req.body.user_id;
	var user_pw = u2f._hash(req.body.user_pw).toString('base64') ; //password must be hashed with SHA256
	var resultData = {};

	//send mysql query to DB, search user that has recieved ID, PW.
	connection.query("select * from user where user_id = '"+user_id+"' and user_pw = '"+user_pw+"'", function(err, rows)
	{
		if(err)	//if error occur 
			resultData.errorMessage = err;
		else if(rows.length < 1)	//if no records found.
			resultData.errorMessage = "Invalid login information.";

		if(resultData.errorMessage)
		{	//if failed 
			showResult(res, resultData);
			return;
		}

		//if success
		var data = rows[0];

		//save user information to the session
		req.session.user_id = data.user_id;	
		req.session.key_handle = data.key_handle;	
		req.session.public_key = data.public_key;
		req.session.authed = false;	//whether authed with U2F

		//create u2f auth request 
		var u2f_req = u2f.request(config.APP_ID, req.session.key_handle);
		req.session.authRequest = u2f_req;

		//render u2f auth page
		res.render('auth.ejs', {data : u2f_req , data_str : JSON.stringify(u2f_req)});
	});
});

// second auth step with U2F Key
app.post('/u2fauth', function(req, res)
{
	//chek u2f user sign
	var checkres = u2f.checkSignature(req.session.authRequest, JSON.parse(req.body.data), req.session.public_key);
	if(!checkres.errorMessage)
	{	//if there's no errors or fails.
		req.session.authed = true;
	}

	//render result page.
	showResult(res, checkres);
});




//registration page, just render registration form 
app.get('/register', function(req, res){
	var u2f_req = u2f.request(config.APP_ID);
	req.session.authRequest = u2f_req;
	
	console.log(' - create u2f registration info : ' + JSON.stringify(u2f_req));
	res.render('register.ejs', {data : u2f_req , data_str : JSON.stringify(u2f_req)});
});

// registration step with U2F key
app.post('/register', function(req, res){
		console.log(req.body.data);

		//check user registraioninfo 
		var checkres = u2f.checkRegistration(req.session.authRequest, JSON.parse(req.body.data));
		var resultData = {};


		if (checkres.successful) {	//if registration check successed.
			var values = {  'user_id' : req.body.user_id,
							'user_pw' : u2f._hash(req.body.user_pw).toString('base64'),
							'key_handle' : checkres.keyHandle,
							'public_key' : checkres.publicKey};

			console.log(JSON.stringify(values));

			//insert new user information into DB.
			connection.query("insert into user set ?", values, function(err, result)
			{
				if(err)	//if  failed.
					resultData.errorMessage = err;
				showResult(res, resultData);
			});
		} else {	//if registration check failed.
			showResult(res, checkres);
		}
});

//function to render result page by using result data 
function showResult(res, resultData)
{
	if(resultData.errorMessage)
	{//if resultData has errorMessage, it's failed result.
		res.render('result.ejs', {result : false , message : resultData.errorMessage });
	}else
	{//otherwise, success result.
		res.render('result.ejs', {result : true , message : "successful"});
	}
}

//setting for certificate for https
var https_options = {
  key: fs.readFileSync('asset/key.pem'),
  cert: fs.readFileSync('asset/cert.pem')
};
http.createServer(app).listen(80);	//open http port 
https.createServer(https_options, app).listen(443); //open https port

console.log('[!] Server activated.');
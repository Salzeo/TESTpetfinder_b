// Requiring npm packages
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var sequelize = require('sequelize');
var moment = require('moment');
var env = require('dotenv').load();
var fileUpload = require('express-fileupload');
// Packages needed to handle authentication
var passport = require('passport');
var session = require('express-session');
// Package for handlebars
var exphbs = require('express-handlebars');

var port = process.env.PORT || 8080;
var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

app.use(express.static('./views'));
// Initialzing passport and the express-session and add them as middleware
app.use(session({ secret: 'keyboard cat',resave: true, saveUninitialized:true})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

var db = require('./models');
// Requiring authentication route auth.js
var authRoute = require('./routing/auth')(app, passport);

require('./config/passport/passport.js')(passport, db.user);

app.use(fileUpload());


// Requiring API routes
var setUpApiRoutes = require('./routing/apiroutes');
// Requiring HTML routes
var setUpHtmlRoutes = require('./routing/htmlroutes');
setUpApiRoutes(app);
setUpHtmlRoutes(app);

// handling the upload
getting the file from ifound.html
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/views', 'ifound.html'));
});

// placeholder for getting the file from ilost.html
app.post('/upload', function(req, res) {

});



//code for images on ilost
var multer = require('multer');
var fs = require('fs');

const Sequelize = require('sequelize');
var sequelize = new Sequelize('thepetfinder', 'root', '', { dialect: 'mysql' });

var User = sequelize.define('user', {
  username: Sequelize.STRING,
  email: Sequelize.STRING,
  pet_image: Sequelize.STRING
});

sequelize.sync();

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('view engine', 'hbs');
app.set('view options', { layout: 'layouts/main.hbs' });

app.use(multer({ dest: path.join(__dirname, '/temp')}).any());

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res) {
	User.findAll().then(function(users) {
		res.render('index', {users: users});
	});
});

app.get('/ilost', function(req, res) {
	res.render('ilost');
});

app.post('/users', function(req, res) {
	// get the file data from the temporary image file that multer creates for us in the /temp folder
	fs.readFile(req.files[0].path, function(err, data) {
	    if (err) return console.log('Error: ' + err);

			// create a file name that we will use to create the image
	    var file_name = req.body.name + '_pet.png';
	    // create the url path where we will store the image
	    // needs to be in the in the public directory so the front end can access it
			var image_url = path.join(__dirname, '/public/pets/' + file_name);

			// Save the image to the public/profiles directory using the data we got from the readFile as binary
			fs.writeFile(image_url, data, 'binary', function(err){
		    if (err) throw err;

				// Create a new user and set the profile_image to the file name
				// so we can simply link to the image in our handlebars view
				User.create({
					username: req.body.name,
					email: req.body.email,
					pet_image: file_name
				}).then(function() {
					res.redirect('/');
				});
		  });
	});
});




// Development
// The sequelize property on db is the connection to the db
// The sync method that creates tables from the models
db.sequelize.sync().then(function(){
  require('./routing/apiroutes.js')(app, db);
 // After synching, the express server starts
  app.listen(port, function(){
    console.log("Server listening on " + port);
  });
});

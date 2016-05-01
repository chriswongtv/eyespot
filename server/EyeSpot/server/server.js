var packageVersion = require('./../package.json').version;
console.log("packageVersion :: " + packageVersion);

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();
const fs = require('fs');

// ------------ Protecting mobile backend with Mobile Client Access start -----------------

// Load passport (http://passportjs.org)
var passport = require('passport');

// Get the MCA passport strategy to use
var MCABackendStrategy = require('bms-mca-token-validation-strategy').MCABackendStrategy;

// Tell passport to use the MCA strategy
passport.use(new MCABackendStrategy())

// Tell application to use passport
app.use(passport.initialize());

// Protect DELETE endpoint so it can only be accessed by HelloTodo mobile samples
app.delete('/api/Items/:id', passport.authenticate('mca-backend-strategy', {session: false}));

app.post('/api/speech', function(req, res) {
	var watson = require('watson-developer-cloud');
	var speech_to_text = watson.speech_to_text({
	  username: '3d749b01-ff2d-42f5-8d5d-21266a3a613b',
	  password: 'Co8hMiHS4neh',
	  version: 'v1'
	});

	var params = {
	  audio: fs.createReadStream(res.body),
	  content_type: 'audio/wav',
	  timestamps: true,
	  word_alternatives: 0.9
	};

	speech_to_text.recognize(params, function(err, transcript) {
	  if (err)
	    console.log(err);
	  else
	    console.log(JSON.stringify(transcript, null, 2));
	});
});

// Protect /protected endpoint which is used in Getting Started with Bluemix Mobile Services tutorials
app.get('/protected', passport.authenticate('mca-backend-strategy', {session: false}), function(req, res){
	res.send("Hello, this is a protected resouce of the mobile backend application!");
});
// ------------ Protecting backend APIs with Mobile Client Access end -----------------

app.start = function () {
	// start the web server
	return app.listen(function () {
		app.emit('started');
		var baseUrl = app.get('url').replace(/\/$/, '');
		console.log('Web server listening at: %s', baseUrl);
		var componentExplorer = app.get('loopback-component-explorer');
		if (componentExplorer) {
			console.log('Browse your REST API at %s%s', baseUrl, componentExplorer.mountPath);
		}
	});
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
	if (err) throw err;
	if (require.main === module)
		app.start();
});


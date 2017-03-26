var express = require('express'), bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

var app = express();
app.use(bodyParser.json());

var ip_addr = process.env.OPENSHIFT_NODEJS_IP  || 127.0.0.1';
var port    = process.env.OPENSHIFT_NODEJS_PORT || '8080';
// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017/deepTrafficData';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}

mongoose.connect('mongodb://'+connection_string);
 
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});

var userSchema = new mongoose.Schema({
       // _id: 'string',
	user: 'string',
	mph: 'number'
});

userSchema.statics.findByName = function (name, cb) {
  return this.find({ user: new RegExp(name, 'i') }, cb);
}

var UserModel = mongoose.model('users', userSchema);

app.get('/api/',function(req,res) {
	res.send('Working');
});

app.get('/api/users', function(req,res) {
	UserModel.find({},function(err,docs) {
		if(err) {
			res.send(err);
		}
		else {
			res.send(docs);
		}
	});
});

app.post('/api/newUser', function(request, response){
    var newUser = new UserModel(request.body);
    UserModel.findByName(newUser.user, function (err, similarUsers) {
        if (similarUsers.length === 0) {
            newUser.save(function (err) {
                if (err) {
                    response.send('Data is not saved');
                    return err;
                }
            });
        }
        else {
            var user = similarUsers[0];
            if (newUser.mph > user.mph) {
                user.mph = newUser.mph;
                user.save(function (err) {
                    if (err) {
                        response.send('Data is not saved');
                        return err;
                    }
                });
            }
        }
    });
    response.send('Data is saved');
});

app.listen('4500');


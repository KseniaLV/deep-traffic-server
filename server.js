var express = require('express'), bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

var app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/deepTrafficData');
 
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

let express = require('express'), bodyParser = require('body-parser');
let mongoose = require('mongoose');
let nodemailer = require('nodemailer');

mongoose.Promise = require('bluebird');

let app = express();
app.use(bodyParser.json());

let port = process.env.port || 4500;

mongoose.connect('mongodb://ksenialv:1007905k!@clusterdeeptr-shard-00-00-22vim.mongodb.net:27017,clusterdeeptr-shard-00-01-22vim.mongodb.net:27017,clusterdeeptr-shard-00-02-22vim.mongodb.net:27017/deepTrafficData?ssl=true&replicaSet=ClusterDeepTr-shard-0&authSource=admin');
 
/*app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '');
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});*/

let userSchema = new mongoose.Schema({
	user: 'string',
	mph: 'number'
});

userSchema.statics.findByName = function (name, cb) {
  return this.find({ user: new RegExp(name, 'i') }, cb);
}

let UserModel = mongoose.model('users', userSchema);

let transporter = nodemailer.createTransport({
    service: 'Yandex',
    auth: {
        user: 'deepTraffic@yandex.ru',
        pass: 'traffic704!'
    }
});

let mailOptions = {
    from: '"Deep Traffic" <deepTraffic@yandex.ru>',
    to: 'user',
    subject: 'Deep Traffic competition',
    text: 'Your last result is '
};

app.get('/api/',function(req,res) {
	res.send('Working');
});

app.get('/api/userrecords', function(req,res) {
	UserModel.find({}).sort({mph: -1}).limit(10).exec(function(err,docs) {
		if(err) {
			res.send(err);
		}
		else {
			res.send({userrecords: docs});
		}
	});
});

app.post('/api/users', function(request, response){
    let newUser = new UserModel(request.body.user);
    let bestResult = newUser.mph, currentResult = newUser.mph;
    UserModel.findByName(newUser.nick, function (err, similarUsers) {
        if (similarUsers.length === 0) {
            newUser.save(function (err) {
                if (err) {
                    response.send('Data is not saved');
                    return err;
                }
            });
        }
        else {
            let user = similarUsers[0];
            if (newUser.mph > user.mph) {
                user.mph = newUser.mph;
                user.save(function (err) {
                    if (err) {
                        response.send('Data is not saved');
                        return err;
                    }
                });
            } else {
                bestResult = user.mph;
            }
        }
        mailOptions.to = request.body.user.email;
        mailOptions.text = 'Your last result is ' + currentResult + " kmph. Your best result is " + bestResult + " kmph.";
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
        });
    });
    response.send('Data is saved');
});

let server = app.listen(port);

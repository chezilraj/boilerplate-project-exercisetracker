const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const shortid = require('shortid');
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
const userSchema = new Schema({
  name: String,
	_id: String
});

const addExerciseSchema = new Schema({
  _id: String,
	description: String,
	duration: Number,
	date: String
});
const User = mongoose.model('User', userSchema);
const AddExercise = mongoose.model('AddExercise', addExerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async(req, res) => {
	console.log(req.body)
	const username = req.body.username;
	const userId = shortid.generate();
	try {
		await User.create({name : username, _id: userId})
		res.json({username : username, _id: userId})
	}
	catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
})

app.post('/api/users/:_id/exercises', async(req, res) => {
	const userId = req.params._id;
	const description = req.body.description;
	const duration = req.body.duration;
	const date = req.body.date;
	console.log(description);
	try {
			const user = await User.find({_id: userId});
			if(user && user.length > 0){
				await AddExercise.create({_id : userId, description: description, duration: duration, date: date})
				res.json({_id : userId, username: user.name, date: date, duration: duration, description: description})
			}else{
				return res.status(404).json({ error: 'User not found' });
			}
	}
	catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

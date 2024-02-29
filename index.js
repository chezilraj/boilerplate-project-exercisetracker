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
	username: String,
});

const exerciseSchema = new Schema({
	userId: String,
	username: String,
	description: {type: String, required: true},
	duration: {type: Number, required: true},
	date: {type: Date, default: Date.now(), required: false},
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async(req, res) => {
	const username = req.body.username;

	try {
		let newUser = await User.create({username})
		res.json({username : username, _id: newUser._id })
	}
	catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
})
app.get('/api/users', async(req, res) => {
	try {
		// await User.deleteMany({});
    // await Exercise.deleteMany({});
		// res.json({ message: 'All data removed from the database.' });
			const users = await User.find();
			if(users && users.length > 0){
				res.json(users)
			}else{
				return res.status(404).json({ error: 'User not found' });
			}
	}
	catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
})
app.post('/api/users/:_id/exercises', async(req, res) => {
	try {
			const userId = req.params._id;
			const {description, duration, date} = req.body;
			

			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}
			const exercise = new Exercise({ 
				userId: user._id,
				username: user.username,
				description: description,
				duration: parseInt(duration),
				date: date,
			 });
			let saveExercise = await exercise.save();
			
			res.json({
				username: user.username,
				description: exercise.description,
				duration: exercise.duration,
				date: new Date(exercise.date).toDateString(),
				_id: user._id,
			});
	}
	catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
})
app.get('/api/users/:_id/logs', async(req, res) => {
	try {
		const userId = req.params._id;
		const fromDate = req.query.from; 
		const toDate = req.query.to;
		const limit = parseInt(req.query.limit) || null;
				// Construct query based on user ID
				const query = { userId };

				// Add conditions for date range if provided
				if (fromDate && toDate) {
					query['date'] = { $gte: new Date(fromDate), $lte: new Date(toDate) };
				} else if (fromDate) {
					query['date'] = { $gte: new Date(fromDate) };
				} else if (toDate) {
					query['date'] = { $lte: new Date(toDate) };
				}

		let exercises = await Exercise.find(query);

		if(exercises && exercises.length > 0){
			if (limit !== null) {
				exercises = exercises.slice(0, limit);
			}
			const formattedUsers = {count: exercises.length, log: exercises.map(exercise => ({ description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString()}))}
			res.json(formattedUsers)
		}else{
			return res.status(404).json({ error: 'User not found' });
		}
}
catch (err) {
	console.error(err);
	res.status(500).json({ error: 'Internal Server Error' });
}
})
// app.get('/api/users/:_id/logs', async(req, res) => {
// 	try {
// 			const userId = req.params._id;
// 			const from = req.query.from || new Date(0).toISOString().substring(0, 10);
// 			const to =
// 				req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
// 			const limit = parseInt(req.query.limit) || null;

// 			const user = await User.findById(userId).exec();

// 			const exercises = await Exercise.find({userId, date: { $gte: from, $lte: to }})
// 			.select('description duration date')
// 			.limit(limit)
// 			.exec();

// 			let log = exercises.map((exercise) => {
// 				return {
// 					description: exercise.description,
// 					duration: exercise.duration,
// 					date: new Date(exercise.date).toDateString(),
// 				};
// 			});
// 			res.json({
// 				_id: user._id,
// 				username: user.username,
// 				count: Number(log.length),
// 				log: log,
// 			});
// 	}
// 	catch (err) {
// 		console.error(err);
// 		res.status(500).json({ error: 'Internal Server Error' });
// 	}
// })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

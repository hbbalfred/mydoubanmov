const MongoClient = require('mongodb').MongoClient;
const system = require('./system');

module.exports = {
	createMovie: create,
	updateMovie: update,
	queryAllNoNameMovies,
};

let movie_repo;
MongoClient.connect('mongodb://127.0.0.1:27017', (err, client) => {
	if (err) {
		handle_error(err);
		return process.exit(1);
	}

	movie_repo = client.db('douban').collection('movie');

	system.ready('db');
});


function queryAllNoNameMovies(cb) {
	movie_repo.find({ name: { $eq: '' } }).toArray((err, result) => {
		if (err) return handle_error(err);

		cb(null, result.map(x => x.movie_id));
	});
}

function create(movie_id) {
	const record = {
		movie_id,
		name: '',
		roles: [],
		directors: [],
		writers: [],
		categories: [],
		areas: [],
		langs: [],
		duration: 0,
		alias: [],
		release_time: 0,
		create_time: Date.now(),
		stars: 0,
		my_stars: 0,
	};

	movie_repo.findOneAndUpdate({ movie_id }, record, { upsert: true }, (err, result) => {
		if (err) {
			return handle_error(err);
		}
		if (result.ok !== 1) {
			return handle_error('fail to create a record');
		}

		console.log(`create movie ${movie_id}`);
	});
}

function update(movie_id, data) {
	const update_data = { ...data };
	update_data['movie_id'] = movie_id;
	movie_repo.findOneAndUpdate({ movie_id }, update_data, (err, result) => {
		if (err) {
			return handle_error(err);
		}
		if (result.ok !== 1) {
			return handle_error(result.lastErrorObject);
		}

		console.log(`update movie ${movie_id}`);
	});
}

function handle_error(err) {
	console.error(err);
}
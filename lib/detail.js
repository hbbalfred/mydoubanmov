const fs = require('fs');
const { www_get, tag2dict } = require('./utils');
const { pushTask } = require('./task');
const { updateMovie, queryAllNoNameMovies } = require('./repo');

module.exports = detail;

function detail() {
	queryAllNoNameMovies((err, movies) => {
		console.log(`need update movies: ${movies.length}`);
		for (const movie_id of movies) {
			makeTask_fetchMovieInfo(movie_id);
		}
	});
}

function makeTask_fetchMovieInfo(movie_id) {
	pushTask((task) => {
		fetchMovieInfo(movie_id, (err, movie) => {
			if (err) return task.error(err);

			updateMovie(movie_id, movie);

			task.end();
		});
	});
}

const INVALID = Symbol('invalid');

const parser = {
	name: function (raw, mov) {
		const key = '<span property="v:itemreviewed">';
		const a = raw.indexOf(key);
		const b = raw.indexOf('</span>', a);
		if (a === -1 || b === -1) {
			mov.name = INVALID;
		}

		mov.name = raw.slice(a + key.length, b);
	},
	_celebrities: function (raw) {
		const ret = [];
		const key = '<a href="/celebrity/';
		let i = 0;
		while ((i = raw.indexOf(key, i)) > -1) {
			const a = i + key.length;
			const b = raw.indexOf('/', a);
			ret.push(raw.slice(a, b));
			i = b;
		}
		return ret.length > 0 ? ret : INVALID;
	},
	directors: function (raw, mov) {
		mov.directors = parser._celebrities(raw);
	},
	writers: function (raw, mov) {
		mov.writers = parser._celebrities(raw);
	},
	roles: function (raw, mov) {
		mov.roles = parser._celebrities(raw);
	},
	_partial: function (raw) {
		const i = raw.indexOf(':');
		if (i === -1) {
			return INVALID;
		}
		const ret = raw.substr(i + 1).split(' / ').map(x => x.trim());
		return ret.length > 0 ? ret : INVALID;
	},
	categories: function (raw, mov) {
		mov.categories = parser._partial(raw);
	},
	areas: function (raw, mov) {
		mov.areas = parser._partial(raw);
	},
	langs: function (raw, mov) {
		mov.langs = parser._partial(raw);
	},
	release_time: function (raw, mov) {
		mov.release_time = parser._partial(raw);
	},
	duration: function (raw, mov) {
		mov.duration = parser._partial(raw);
	},
	alias: function (raw, mov) {
		mov.alias = parser._partial(raw);
	},
	stars: function (raw, mov) {
		const key = '<strong class="ll rating_num" property="v:average">';
		const a = raw.indexOf(key);
		const b = raw.indexOf('</strong>', a);
		const stars = parseFloat(raw.slice(a + key.length, b));
		if (isNaN(stars)) {
			return INVALID;
		}

		mov.stars = stars;
	},
};

function fetchMovieInfo(movie_id, cb) {
	const movie_url = `https://movie.douban.com/subject/${movie_id}/`;
	www_get(movie_url, (err, data) => {
		if (err) return cb(err);

		const movie = {};


		const a = data.indexOf('<div id="info">');
		const b = data.indexOf('</div>', a);
		if (a === -1 || b === -1) return cb(new Error(`can not found the movie info: ${movie_id}`));

		const info_data = data.slice(a, b)
			.replace(/<span\b[^>]+>/g, '')
			.replace(/<\/span>/g, '')
			.replace(/<br\/?>/g, '');

		const fields = [
			{ label: '导演:', field: 'directors' },
			{ label: '编剧:', field: 'writers' },
			{ label: '主演:', field: 'roles' },
			{ label: '类型:', field: 'categories' },
			{ label: '制片国家/地区:', field: 'areas' },
			{ label: '语言:', field: 'langs' },
			{ label: '上映日期:', field: 'release_time' },
			{ label: '片长:', field: 'duration' },
			{ label: '又名:', field: 'alias' },
			{ label: 'IMDb链接:', field: null },
		];

		for (let i = 1, n = fields.length; i < n; ++i) {
			const a = info_data.indexOf(fields[i - 1].label);
			const b = info_data.indexOf(fields[i].label);
			const field = fields[i - 1].field;
			parser[field](info_data.slice(a, b), movie);
		}

		parser.name(data, movie);
		parser.stars(data, movie);

		const invalid_fields = [];
		let count = 0;
		for (const field in movie) {
			if (movie[field] === INVALID) {
				invalid_fields.push(field);
			}
			++count;
		}

		if (invalid_fields.length === count) {
			return cb(new Error(`invalid movie data: ${movie_id}`));
		}

		if (invalid_fields.length > 0) {
			console.warn(`can not found "${invalid_fields.join(',')} in movie": ${movie_id}`);
		}

		cb(null, movie);
	}, (chunk) => chunk.indexOf('<div class="ratings-on-weight">') > -1);
}
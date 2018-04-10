const { www_get, tag2dict } = require('./utils');
const { pushTask } = require('./task');
const { createMovie } = require('./repo');


migrate('faseer');
// console.log("You forget to execute 'migrate'");

function migrate(user) {
	makeTask_fetchPageList(user);
}

function makeTask_fetchPageList(user) {
	pushTask((task) => {
		fetchPageList(user, (err, pages) => {
			if (err) return task.error(err);

			for (const page_url of pages) {
				makeTask_fetchMovieList(page_url);
			}
			task.end();
		});
	});
}

function makeTask_fetchMovieList(page_url) {
	pushTask((task) => {
		fetchMovieListOnePage(page_url, (err, movie_list) => {
			if (err) return task.error(err);

			// exp: https://movie.douban.com/subject/26815162/
			const prefix = 'https://movie.douban.com/subject/';
			
			for (const movie_url of movie_list) {
				let id = movie_url.substr(prefix.length);
				id = parseInt(id);
				createMovie(id);
			}
			task.end();
		});
	});
}

function fetchPageList(user, cb) {
	let pages = [];
	const my_url = `https://movie.douban.com/people/${user}/collect`;
	const SINGLE_PAGE_NUM = 15;
	www_get(my_url, (err, data) => {
		if (err) return cb(err);

		const x = data.indexOf('<span class="thispage" data-total-page');
		console.assert(x > -1, 'can not found data total page');

		const tag = data.slice(x, data.indexOf('>', x));
		const dict = tag2dict(tag);
		const total = parseInt(dict['data-total-page']);

		for (let i = 0; i < total; ++i) {
			pages[i] = `${my_url}?start=${SINGLE_PAGE_NUM * i}&amp;sort=time&amp;rating=all&amp;filter=all&amp;mode=grid`;
		}

		console.info(`total pages=${total}, movies about=${total * SINGLE_PAGE_NUM}`);
		if (cb) cb(null, pages);
	}, (chunk) => chunk.indexOf('<div class="aside">') > -1);
}

function fetchMovieListOnePage(page_url, cb) {
	let movies = [];
	www_get(page_url, (err, data) => {
		if (err) return cb(err);

		const x = data.indexOf('<div class="grid-view">');
		console.assert(x > -1, 'can not found movie list');

		const tag_key = '<a href="https://movie.douban.com/subject';
		let i = data.indexOf(tag_key, x);
		while (i > -1) {
			const b = data.indexOf('>', i);
			const atag = data.slice(i, b);
			const dict = tag2dict(atag);
			movies.push(dict['href']);
			i = data.indexOf(tag_key, b);
		}

		if (cb) cb(null, movies);
	}, (chunk) => chunk.indexOf('<div class="paginator">') > -1);
}
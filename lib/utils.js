const https = require('https');

module.exports = {
	www_get, tag2dict
};

function www_get(url, end_cb, chunk_abort) {
	const req = https.get(url, (res) => {
		if (res.statusCode >= 400) {
			res.resume();
			return end_cb(new Error(`fail to request, code=${res.statusCode}, url=${url}`));
		}

		res.setEncoding('utf8');
		let rawData = '';
		res.on('data', (chunk) => {
			rawData += chunk;
			if (chunk_abort && chunk_abort(rawData)) {
				res.on('abort', () => res.emit('end'));
				req.abort();
				return;
			}
		});
		res.on('end', () => end_cb && end_cb(null, rawData)).on('error', (err) => err && end_cb(err));
	});
	return req;
}

function tag2dict(tag) {
	const ret = {};

	if (tag) {
		const arr = tag.replace(/(\<|\>)/g, '').split(' ').map(x => x.trim());
		for (const item of arr) {
			const t = item.indexOf('=');
			if (t > -1) {
				ret[item.slice(0, t)] = item.slice(t + 2, -1);
			}
		}
	}

	return ret;
}
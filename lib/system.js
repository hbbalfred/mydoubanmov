module.exports = {
	register,
	ready,
	start: () => console.warn('not impl system start'),
};

const model_list = [];


function register(model) {
	model_list.push({ model });
}

function ready(model) {
	const model_obj = model_list.find(x => x.model === model);
	if (!model_obj) {
		return console.warn(`unknown model: ${model}`)
	}

	model_obj.ready = true;

	if (model_list.every(x => x.ready)) {
		module.exports.start();
	}
}

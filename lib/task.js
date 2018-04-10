const EventEmitter = require('events').EventEmitter;


module.exports = {
	pushTask,
	taskQueue,
};

let task_queue;
function taskQueue() {
	if (!task_queue) {
		task_queue = new TaskQueueClass();
		task_queue.run();
	}
	return task_queue;
}

function pushTask(execute, end) {
	const task = new TaskClass();
	task._execute = execute;
	task._end = end;
	taskQueue().addTask(task);
}

class TaskClass {
	constructor() {
		this.e = new EventEmitter();
		this._execute = this._end = null;
	}
	execute() {
		if (this._execute) this._execute(this);
	}
	end() {
		if (this._end) this._end(this);
		this.e.emit('end');
	}
	error(err) {
		console.error(err);
		this.e.emit('end');
	}
}

class TaskQueueClass {
	constructor() {
		this.head = this.tail = {};
		this.timer = 0;
	}
	addTask(task) {
		this.tail.task = task;
		this.tail = this.tail.next = {};
	}
	run() {
		this._check();
	}
	_runTask(task) {
		task.e.on('end', () => this._endTask());
		task.execute();
	}
	_endTask() {
		if (this.head === this.tail) {
			console.log('task queue is empty!');
			this._check();
		} else {
			setTimeout(() => this._nextTask(), Math.random() * 3000); // random interval avoid deny
		}
	}
	_nextTask() {
		const task = this.head.task;
		this.head = this.head.next;
		this._runTask(task);
	}
	_check() {
		this.timer = setInterval(() => {
			if (this.head !== this.tail) {
				console.log('found new task(s) ~ task queue run');
				clearInterval(this.timer);
				this._nextTask();
			}
		}, 2000);
	}
}

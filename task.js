var Class = require('class');
var Event = require('event');

var Task = Class.extend({
	/**
	 * @constructor
	 * @param {Function} [callback]
	 * @param {*} context
	 */
	constructor: function(callback, context) {
		if (callback !== undefined) {
			this.callback = callback;
		}
		if (context !== undefined) {
			this.context = context;
		}
		this.running = new Event();
		this.completed = new Event();
		this.failed = new Event();
		this.state = Task.State.PENDING;
	},

	/**
	 * Runs the task
	 * @param {Function} [onCompleted]
	 * @param {Function} [onFailed]
	 * @param {*} [context]
	 */
	run: function(onCompleted, onFailed, context) {
		if (this.state === Task.State.RUNNING) {
			throw new Error('Task is already running.');
		}
		if (onCompleted) {
			this.completed.add(onCompleted, context);
		}
		if (onFailed) {
			this.failed.add(onFailed, context);
		}
		this.state = Task.State.RUNNING;
		this.result = undefined;
		this.error = undefined;
		this.onRunning();
		this.execute();
	},

	/**
	 * @protected
	 */
	onRunning: function() {
		this.running.trigger(this);
	},

	/**
	 * @protected
	 */
	execute: function() {
		if (this.callback) {
			this.callback.call(this.context, this);
		}
	},

	/**
	 * @protected
	 * @param {*} [result]
	 */
	complete: function(result) {
		if (result !== undefined) {
			this.result = result;
		}
		this.onCompleted();
	},

	/**
	 * @protected
	 */
	onCompleted: function() {
		this.completed.trigger(this, this.result);
	},

	/**
	 * @protected
	 * @param {*} [error]
	 */
	fail: function(error) {
		if (error !== undefined) {
			this.error = error;
		}
		this.onFailed();
	},

	/**
	 * @protected
	 */
	onFailed: function() {
		this.failed.trigger(this, this.error);
	},

	/**
	 * @returns {Tasks.Task.State}
	 */
	getState: function() {
		return this.state;
	},

	/**
	 * @returns {Boolean}
	 */
	isPending: function() {
		return this.state === Task.State.PENDING;
	},

	/**
	 * @returns {Boolean}
	 */
	isRunning: function() {
		return this.state === Task.State.RUNNING;
	},

	/**
	 * @returns {Boolean}
	 */
	isCompleted: function() {
		return this.state === Task.State.COMPLETED;
	},

	/**
	 * @returns {Boolean}
	 */
	isFailed: function() {
		return this.state === Task.State.FAILED;
	},

	/**
	 * @returns {*}
	 */
	getResult: function() {
		return this.result;
	},

	/**
	 * @returns {*}
	 */
	getError: function() {
		return this.error;
	},

	/**
	 * @param {Task} task
	 * @param {Function} onSuccess
	 */
	runTask: function(task, onSuccess) {
		task.run(onSuccess, this.onTaskFailed, this);
	},

	/**
	 * @protected
	 * @param {Task} task
	 * @param {*} error
	 */
	onTaskFailed: function(task, error) {
		this.fail(error);
	},

	/**
	 * @protected
	 * @param {Task} task
	 * @param {*} result
	 */
	onTaskCompleted: function(task, result) {
		this.complete(result);
	}
}, {
	State: {
		PENDING: 0,
		RUNNING: 1,
		COMPLETED: 2,
		FAILED: 3
	}
});

module.exports = Task;
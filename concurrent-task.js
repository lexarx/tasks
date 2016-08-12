var Task = require('tasks/task');
var ObservableCollection = require('collections/observable-collection');

var ConcurrentTask = Task.extend({
	/**
	 * @constructor
	 * @param {Tasks.ConcurrentTask.Parameters} [parameters]
	 */
	constructor: function(parameters) {
		if (parameters !== undefined && parameters.result !== undefined) {
			this.returnResult = parameters.result;
		} else {
			this.returnResult = false;
		}
		this.tasks = new ObservableCollection();
		this.tasks.changed.add(this.onTasksChanged, this);
		if (parameters !== undefined && parameters.tasks !== undefined) {
			this.tasks.setItems(parameters.tasks);
		}
		this.super();
	},

	/**
	 * @protected
	 * @param {Collections.ObservableCollection} collection
	 * @param {Collections.CollectionChange} change
	 */
	onTasksChanged: function(collection, change) {
		if (this.state === Task.State.RUNNING) {
			throw new Error('Collection of tasks can\'t be modified while the task is running.');
		}
		for (var i = 0; i < change.oldItems.length; i++) {
			var task = change.oldItems[i];
			task.completed.remove(this.onTaskCompleted, this);
			task.failed.remove(this.onTaskFailed, this);
		}
		for (var i = 0; i < change.newItems.length; i++) {
			var task = change.newItems[i];
			task.completed.add(this.onTaskCompleted, this);
			task.failed.add(this.onTaskFailed, this);
		}
	},

	/**
	 * @protected
	 * @override
	 */
	execute: function() {
		this.tasksCompleted = 0;
		this.tasksFailed = 0;
		if (this.tasks.count() > 0) {
			this.tasks.each(function(task) {
				task.run();
			});
		} else {
			this.checkState();
		}
	},

	/**
	 * @protected
	 */
	onTaskCompleted: function() {
		if (this.state !== Task.State.RUNNING) {
			return;
		}
		this.tasksCompleted++;
		this.checkState();
	},

	/**
	 * @protected
	 * @param {Task} task
	 * @param {*} error
	 */
	onTaskFailed: function(task, error) {
		if (this.state !== Task.State.RUNNING) {
			return;
		}
		this.error = error;
		this.tasksFailed++;
		this.checkState();
	},

	/**
	 * @private
	 */
	checkState: function() {
		if (this.tasksCompleted + this.tasksFailed === this.tasks.count()) {
			if (this.tasksFailed === 0) {
				var result;
				if (this.returnResult) {
					result = this.tasks.map(function(task) {
						return task.getResult();
					});
				}
				this.complete(result);
			} else {
				this.fail();
			}
		}
	}
});

/**
 * @typedef Parameters
 * @namespace Tasks.ConcurrentTask
 * @property {Boolean} result
 * @property {Array<Tasks.Task>} tasks
 */

module.exports = ConcurrentTask;
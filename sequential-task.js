define('tasks/sequential-task', [
	'tasks/task', 'collections/observable-collection'
], function(Task, ObservableCollection) {
	return Task.extend({
		/**
		 * @constructor
		 * @param {Tasks.SequentialTask.Parameters} [parameters]
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
			this.index = -1;
			this.startNextTask();
		},

		/**
		 * @private
		 */
		startNextTask: function() {
			this.index++;
			if (this.index < this.tasks.count()) {
				var task = this.tasks.get(this.index);
				task.run();
			} else {
				var result;
				if (this.returnResult) {
					result = this.tasks.map(function(task) {
						return task.getResult();
					});
				}
				this.complete(result);
			}
		},

		/**
		 * @protected
		 * @param {Task} task
		 */
		onTaskCompleted: function(task) {
			if (this.state !== Task.State.RUNNING) {
				return;
			}
			var index = this.tasks.indexOf(task);
			if (index !== this.index) {
				return;
			}
			this.startNextTask();
		},

		/**
		 * @protected
		 * @param {Task} task
		 * @param {Error} error
		 */
		onTaskFailed: function(task, error) {
			if (this.state !== Task.State.RUNNING) {
				return;
			}
			var index = this.tasks.indexOf(task);
			if (index !== this.index) {
				return;
			}
			this.fail(error);
		}
	});

	/**
	 * @typedef Parameters
	 * @namespace Tasks.SequentialTask
	 * @property {Boolean} result
	 * @property {Array<Tasks.Task>} tasks
	 */
});

'use strict';

/* globals define, app, translator, socket, bootbox */


define(['forum/topic/move', 'topicSelect'], function(move, topicSelect) {

	var CategoryTools = {};

	CategoryTools.init = function(cid) {
		CategoryTools.cid = cid;

		topicSelect.init(onTopicSelect);

		$('.delete_thread').on('click', function(e) {
			var tids = topicSelect.getSelectedTids();

			if (tids.length) {
				var command = isAny(isTopicDeleted, tids) ? 'restore' : 'delete';

				translator.translate('[[topic:thread_tools.' + command + '_confirm]]', function(msg) {
					bootbox.confirm(msg, function(confirm) {
						if (!confirm) {
							return;
						}

						socket.emit('topics.' + command, tids, onCommandComplete);
					});
				});
			}

			return false;
		});

		$('.lock_thread').on('click', function(e) {
			var tids = topicSelect.getSelectedTids();
			if (tids.length) {
				socket.emit(isAny(isTopicLocked, tids) ? 'topics.unlock' : 'topics.lock', tids, onCommandComplete);
			}

			return false;
		});

		$('.pin_thread').on('click', function(e) {
			var tids = topicSelect.getSelectedTids();
			if (tids.length) {
				socket.emit(isAny(isTopicPinned, tids) ? 'topics.unpin' : 'topics.pin', tids, onCommandComplete);
			}
			return false;
		});

		$('.markAsUnreadForAll').on('click', function() {
			var tids = topicSelect.getSelectedTids();
			if (tids.length) {
				socket.emit('topics.markAsUnreadForAll', tids, function(err) {
					if(err) {
						return app.alertError(err.message);
					}
					app.alertSuccess('[[topic:markAsUnreadForAll.success]]');

					onCommandComplete();
				});
			}

			return false;
		});

		$('.move_thread').on('click', function() {
			var tids = topicSelect.getSelectedTids();
			console.log(tids);
			if (tids.length) {
				move.init(tids, cid, onCommandComplete);
			}
			return false;
		});


		socket.on('event:topic_deleted', setDeleteState);
		socket.on('event:topic_restored', setDeleteState);
		socket.on('event:topic_locked', setLockedState);
		socket.on('event:topic_unlocked', setLockedState);
		socket.on('event:topic_pinned', setPinnedState);
		socket.on('event:topic_unpinned', setPinnedState);
		socket.on('event:topic_moved', onTopicMoved);
	};

	function closeDropDown() {
		$('.thread-tools.open').find('.dropdown-toggle').trigger('click');
	}

	function onCommandComplete(err) {
		if (err) {
			return app.alertError(err.message);
		}
		closeDropDown();
		topicSelect.unselectAll();
	}

	function onTopicSelect() {
		var tids = topicSelect.getSelectedTids();
		var isAnyDeleted = isAny(isTopicDeleted, tids);
		var isAnyPinned = isAny(isTopicPinned, tids);
		var isAnyLocked = isAny(isTopicLocked, tids);

		translator.translate('<i class="fa fa-fw ' + (isAnyDeleted ? 'fa-comment' : 'fa-trash-o') + '"></i> [[topic:thread_tools.' + (isAnyDeleted ? 'restore' : 'delete') + ']]', function(translated) {
			$('.delete_thread span').html(translated);
		});

		translator.translate('<i class="fa fa-fw fa-thumb-tack"></i> [[topic:thread_tools.' + (isAnyPinned ? 'unpin' : 'pin') + ']]', function(translated) {
			$('.pin_thread').html(translated);
		});

		translator.translate('<i class="fa fa-fw fa-' + (isAnyLocked ? 'un': '') + 'lock"></i> [[topic:thread_tools.' + (isAnyLocked ? 'un': '') + 'lock]]', function(translated) {
			$('.lock_thread').html(translated);
		});
	}

	function isAny(method, tids) {
		for(var i=0; i<tids.length; ++i) {
			if(method(tids[i])) {
				return true;
			}
		}
		return false;
	}

	function isTopicDeleted(tid) {
		return getTopicEl(tid).hasClass('deleted');
	}

	function isTopicLocked(tid) {
		return getTopicEl(tid).hasClass('locked');
	}

	function isTopicPinned(tid) {
		return getTopicEl(tid).hasClass('pinned');
	}

	function getTopicEl(tid) {
		return $('#topics-container li[data-tid="' + tid + '"]');
	}

	function setDeleteState(data) {
		var topic = getTopicEl(data.tid);
		topic.toggleClass('deleted', data.isDeleted);
		topic.find('.fa-lock').toggleClass('hide', !data.isDeleted);
	}

	function setPinnedState(data) {
		var topic = getTopicEl(data.tid);
		topic.toggleClass('pinned', data.isPinned);
		topic.find('.fa-thumb-tack').toggleClass('hide', !data.isPinned);
		ajaxify.go('category/' + CategoryTools.cid);
	}

	function setLockedState(data) {
		var topic = getTopicEl(data.tid);
		topic.toggleClass('locked', data.isLocked);
		topic.find('.fa-lock').toggleClass('hide', !data.isLocked);
	}

	function onTopicMoved(data) {
		getTopicEl(data.tid).remove();
	}

	return CategoryTools;
});

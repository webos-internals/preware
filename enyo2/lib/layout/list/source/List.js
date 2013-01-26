/**
	_enyo.List_ is a control that displays a scrolling list of rows, suitable
	for displaying very large lists. It is optimized such that only a small
	portion of the list is rendered at a given time. A flyweight pattern is
	employed, in which controls placed inside the list are created once, but
	rendered for each list item. For this reason, it's best to use only simple
	controls in	a List, such as <a href="#enyo.Control">enyo.Control</a> and
	<a href="#enyo.Image">enyo.Image</a>.

	A List's _components_ block contains the controls to be used for a single
	row. This set of controls will be rendered for each row. You may customize
	row rendering by handling the _onSetupItem_ event.

	Events fired from within list rows contain the _index_ property, which may
	be used to identify the row	from which the event originated.

	Beginning with Enyo 2.2, lists have built-in support for swipeable and
	reorderable list items.  Individual list items are swipeable by default; to
	enable reorderability, set the _reorderable_ property to true.

	For more information, see the documentation on
	[Lists](https://github.com/enyojs/enyo/wiki/Lists)
	in the Enyo Developer Guide.
*/
enyo.kind({
	name: "enyo.List",
	kind: "Scroller",
	classes: "enyo-list",
	published: {
		/**
			The number of rows contained in the list. Note that as the amount of
			list data changes, _setRows_ can be called to adjust the number of
			rows. To re-render the list at the current position when the count
			has changed, call the _refresh_ method.  If the whole data model of
			the list has changed and you want to redisplay from the top, call
			the _reset_ method instead.
		*/
		count: 0,
		/**
			The number of rows to be shown on a given list page segment.
			There is generally no need to adjust this value.
		*/
		rowsPerPage: 50,
		/**
			If true, renders the list such that row 0 is at the bottom of the
			viewport and the beginning position of the list is scrolled to the
			bottom
		*/
		bottomUp: false,
		/**
			If true, the selection mechanism is disabled. Tap events are still
			sent, but items won't be automatically re-rendered when tapped.
		*/
		noSelect: false,
		//* If true, multiple selections are allowed
		multiSelect: false,
		//* If true, the selected item will toggle
		toggleSelected: false,
		//* If true, the list will assume all rows have the same height for optimization
		fixedHeight: false,
		//* If true, the list will allow the user to reorder list items
		reorderable: false,
		//* Array containing any swipeable components that will be used
		swipeableComponents: [],
		//* If true, swipe functionality is enabled
		enableSwipe: true,
		//* If true, tells list to persist the current swipeable item
		persistSwipeableItem: false
	},
	events: {
		/**
			Fires once per row at render time.
			_inEvent.index_ contains the current row index.
		*/
		onSetupItem: "",
		//* Reorder events
		onSetupReorderComponents: "",
		onSetupPinnedReorderComponents: "",
		onReorder: "",
		//* Swipe events
		onSetupSwipeItem: "",
		onSwipeDrag: "",
		onSwipe: "",
		onSwipeComplete: ""
	},
	handlers: {
		onAnimateFinish: "animateFinish",
		ondrag: "drag",
		onup: "dragfinish",
		onholdpulse: "holdpulse",
		onRenderRow: "rowRendered",
		ondragstart: "dragstart",
		onflick: "flick"
	},
	//* @protected
	rowHeight: 0,
	listTools: [
		{name: "port", classes: "enyo-list-port enyo-border-box", components: [
			{name: "generator", kind: "FlyweightRepeater", canGenerate: false, components: [
				{tag: null, name: "client"}
			]},
			{name: "page0", allowHtml: true, classes: "enyo-list-page"},
			{name: "page1", allowHtml: true, classes: "enyo-list-page"},
			{name: "placeholder", classes: "enyo-list-placeholder"},
			{name: "swipeableComponents", style: "position:absolute; display:block; top:-1000px; left:0px;"}
		]}
	],
	
	//* Reorder vars
	
	initHoldCounter: 3,
	holdCounter: 3,
	holding: false,
	draggingRowIndex: -1,
	dragToScrollThreshold: 0.1,
	prevScrollTop: 0,
	autoScrollTimeoutMS: 20,
	autoScrollTimeout: null,
	pinnedReorderMode: false,
	initialPinPosition: -1,
	itemMoved: false,
	currentPage: null,
	
	//* Swipeable vars
	
	// Index of swiped item
	swipeIndex: null,
	// Direction of swipe
	swipeDirection: null,
	// True if a persistent item is currently persisting
	persistentItemVisible: false,
	// Side from which the persisting item came
	persistentItemOrigin: null,
	// True if swipe was completed
	swipeComplete: false,
	// Timeout used to wait before completing swipe action
	completeSwipeTimeout: null,
	// Time in MS to wait before completing swipe action
	completeSwipeDelayMS: 500,
	// Time in MS for normal swipe animation
	normalSwipeSpeedMS: 200,
	// Time in seconds for fast swipe animation
	fastSwipeSpeedMS: 100,
	// Specifies whether a flick event happened
	flicked: true,
	// Percentage of a swipe needed to force completion of the swipe
	percentageDraggedThreshold: 0.2,

	importProps: function(inProps) {
		// force touch on desktop when we have reorderable items to work around
		// problems with native scroller
		if (inProps.reorderable) {
			this.touch = true;
		}
		this.inherited(arguments);
	},
	create: function() {
		this.pageHeights = [];
		this.inherited(arguments);
		this.getStrategy().translateOptimized = true;
		this.bottomUpChanged();
		this.noSelectChanged();
		this.multiSelectChanged();
		this.toggleSelectedChanged();
	},
	initComponents: function() {
		this.createReorderTools();
		this.inherited(arguments);
		this.createSwipeableComponents();
	},
	createReorderTools: function() {
		this.createComponent({
			name: "reorderContainer", classes: "enyo-list-reorder-container",
			ondown: "sendToStrategy", ondrag: "sendToStrategy",
			ondragstart: "sendToStrategy", ondragfinish: "sendToStrategy",
			onflick: "sendToStrategy"});
	},
	createStrategy: function() {
		this.controlParentName = "strategy";
		this.inherited(arguments);
		this.createChrome(this.listTools);
		this.controlParentName = "client";
		this.discoverControlParent();
	},
	createSwipeableComponents: function() {
		for(var i=0;i<this.swipeableComponents.length;i++) {
			this.$.swipeableComponents.createComponent(this.swipeableComponents[i], {owner: this.owner});
		}
	},
	rendered: function() {
		this.inherited(arguments);
		this.$.generator.node = this.$.port.hasNode();
		this.$.generator.generated = true;
		this.reset();
	},
	resizeHandler: function() {
		this.inherited(arguments);
		this.refresh();
	},
	bottomUpChanged: function() {
		this.$.generator.bottomUp = this.bottomUp;
		this.$.page0.applyStyle(this.pageBound, null);
		this.$.page1.applyStyle(this.pageBound, null);
		this.pageBound = this.bottomUp ? "bottom" : "top";
		if (this.hasNode()) {
			this.reset();
		}
	},
	noSelectChanged: function() {
		this.$.generator.setNoSelect(this.noSelect);
	},
	multiSelectChanged: function() {
		this.$.generator.setMultiSelect(this.multiSelect);
	},
	toggleSelectedChanged: function() {
		this.$.generator.setToggleSelected(this.toggleSelected);
	},
	countChanged: function() {
		if (this.hasNode()) {
			this.updateMetrics();
		}
	},
	sendToStrategy: function(s,e) {
		this.$.strategy.dispatchEvent("on" + e.type, e, s);
	},
	updateMetrics: function() {
		this.defaultPageHeight = this.rowsPerPage * (this.rowHeight || 100);
		this.pageCount = Math.ceil(this.count / this.rowsPerPage);
		this.portSize = 0;
		for (var i=0; i < this.pageCount; i++) {
			this.portSize += this.getPageHeight(i);
		}
		this.adjustPortSize();
	},
	//* Hold pulse handler - use this to delay before running hold logic
	holdpulse: function(inSender,inEvent) {
		if(!this.getReorderable() || this.holding) {
			return;
		}
		// When _holdCounter_ hits 0, process hold event.
		if(this.holdCounter <= 0) {
			this.resetHoldCounter();
			this.hold(inSender,inEvent);
			return;
		}
		this.holdCounter--;
	},
	resetHoldCounter: function() {
		this.holdCounter = this.initHoldCounter;
	},
	//* Hold event handler
	hold: function(inSender, inEvent) {
		inEvent.preventDefault();

		// determine if we should handle the hold event
		if(this.shouldDoReorderHold(inSender, inEvent)) {
			this.holding = true;
			this.reorderHold(inEvent);
			return false;
		}
	},
	//* DragStart event handler
	dragstart: function(inSender, inEvent) {
		return this.swipeDragStart(inSender, inEvent);
	},
	//* Drag event handler
	drag: function(inSender, inEvent) {
		inEvent.preventDefault();

		// determine if we should handle the drag event
		if(this.shouldDoReorderDrag(inEvent)) {
			this.reorderDrag(inEvent);
			return true;
		} else if(this.shouldDoSwipeDrag()) {
			this.swipeDrag(inSender, inEvent);
			return true;
		}
		
		return this.preventDragPropagation;
	},
	//* Flick event handler
	flick: function(inSender, inEvent) {
		if(this.shouldDoSwipeFlick()) {
			this.swipeFlick(inSender, inEvent);
		}
	},
	//* Dragfinish event handler
	dragfinish: function(inSender, inEvent) {
		if(this.getReorderable()) {
			this.resetHoldCounter();
			this.finishReordering(inSender, inEvent);
		}
		this.swipeDragFinish(inSender, inEvent);
	},
	generatePage: function(inPageNo, inTarget) {
		this.page = inPageNo;
		var r = this.$.generator.rowOffset = this.rowsPerPage * this.page;
		var rpp = this.$.generator.count = Math.min(this.count - r, this.rowsPerPage);
		var html = this.$.generator.generateChildHtml();
		inTarget.setContent(html);
		// prevent reordering row from being draw twice
		if(this.getReorderable() && this.draggingRowIndex > -1) {
			this.hideReorderingRow();
		}
		var pageHeight = inTarget.getBounds().height;
		// if rowHeight is not set, use the height from the first generated page
		if (!this.rowHeight && pageHeight > 0) {
			this.rowHeight = Math.floor(pageHeight / rpp);
			this.updateMetrics();
		}
		// update known page heights
		if (!this.fixedHeight) {
			var h0 = this.getPageHeight(inPageNo);
			if (h0 != pageHeight && pageHeight > 0) {
				this.pageHeights[inPageNo] = pageHeight;
				this.portSize += pageHeight - h0;
			}
		}
	},
	update: function(inScrollTop) {
		var updated = false;
		// get page info for position
		var pi = this.positionToPageInfo(inScrollTop);
		// zone line position
		var pos = pi.pos + this.scrollerHeight/2;
		// leap-frog zone position
		var k = Math.floor(pos/Math.max(pi.height, this.scrollerHeight) + 1/2) + pi.no;
		// which page number for page0 (even number pages)?
		var p = (k % 2 === 0) ? k : k-1;
		if (this.p0 != p && this.isPageInRange(p)) {
			this.generatePage(p, this.$.page0);
			this.positionPage(p, this.$.page0);
			this.p0 = p;
			updated = true;
			this.p0RowBounds = this.getPageRowHeights(this.$.page0);
		}
		// which page number for page1 (odd number pages)?
		p = (k % 2 === 0) ? Math.max(1, k-1) : k;
		// position data page 1
		if (this.p1 != p && this.isPageInRange(p)) {
			this.generatePage(p, this.$.page1);
			this.positionPage(p, this.$.page1);
			this.p1 = p;
			updated = true;
			this.p1RowBounds = this.getPageRowHeights(this.$.page1);
		}
		if (updated && !this.fixedHeight) {
			this.adjustBottomPage();
			this.adjustPortSize();
		}
	},
	getPageRowHeights: function(page) {
		var rows = [];
		var allDivs = document.querySelectorAll('#' + page.id + " div[data-enyo-index]");
		for (var i=0, index, bounds; i < allDivs.length; i++) {
			index = allDivs[i].getAttribute("data-enyo-index");
			if (index !== null) {
				bounds = enyo.dom.getBounds(allDivs[i]);
				rows.push({height: bounds.height, width: bounds.width, index: index});
			}
		}
		return rows;
	},
	updateRowBounds: function(index) {
		var updateIndex = this.getRowBoundsUpdateIndex(index, this.p0RowBounds);
		if (updateIndex > -1) {
			this.updateRowBoundsAtIndex(updateIndex, this.p0RowBounds, this.$.page0);
			return;
		}
		updateIndex = this.getRowBoundsUpdateIndex(index, this.p1RowBounds);
		if (updateIndex > -1) {
			this.updateRowBoundsAtIndex(updateIndex, this.p1RowBounds, this.$.page1);
			return;
		}
	},
	getRowBoundsUpdateIndex: function(index, rows) {
		for (var i=0; i < rows.length; i++) {
			if (rows[i].index == index) {
				return i;
			}
		}
		return -1;
	},
	updateRowBoundsAtIndex: function(updateIndex, rows, page) {
		var rowDiv = document.querySelectorAll('#' + page.id + ' div[data-enyo-index="' + rows[updateIndex].index + '"]');
		var bounds = enyo.dom.getBounds(rowDiv[0]);
		rows[updateIndex].height = bounds.height;
		rows[updateIndex].width = bounds.width;
	},
	updateForPosition: function(inPos) {
		this.update(this.calcPos(inPos));
	},
	calcPos: function(inPos) {
		return (this.bottomUp ? (this.portSize - this.scrollerHeight - inPos) : inPos);
	},
	adjustBottomPage: function() {
		var bp = this.p0 >= this.p1 ? this.$.page0 : this.$.page1;
		this.positionPage(bp.pageNo, bp);
	},
	adjustPortSize: function() {
		this.scrollerHeight = this.getBounds().height;
		var s = Math.max(this.scrollerHeight, this.portSize);
		this.$.port.applyStyle("height", s + "px");
	},
	positionPage: function(inPage, inTarget) {
		inTarget.pageNo = inPage;
		var y = this.pageToPosition(inPage);
		inTarget.applyStyle(this.pageBound, y + "px");
	},
	pageToPosition: function(inPage) {
		var y = 0;
		var p = inPage;
		while (p > 0) {
			p--;
			y += this.getPageHeight(p);
		}
		return y;
	},
	positionToPageInfo: function(inY) {
		var page = -1;
		var p = this.calcPos(inY);
		var h = this.defaultPageHeight;
		while (p >= 0) {
			page++;
			h = this.getPageHeight(page);
			p -= h;
		}
		page = Math.max(page, 0);
		return {no: page, height: h, pos: p+h};
	},
	isPageInRange: function(inPage) {
		return inPage == Math.max(0, Math.min(this.pageCount-1, inPage));
	},
	getPageHeight: function(inPageNo) {
		return this.pageHeights[inPageNo] || this.defaultPageHeight;
	},
	invalidatePages: function() {
		this.p0 = this.p1 = null;
		// clear the html in our render targets
		this.$.page0.setContent("");
		this.$.page1.setContent("");
	},
	invalidateMetrics: function() {
		this.pageHeights = [];
		this.rowHeight = 0;
		this.updateMetrics();
	},
	scroll: function(inSender, inEvent) {
		var r = this.inherited(arguments);
		this.update(this.getScrollTop());
		if(this.shouldDoPinnedReorderScroll()) {
			this.reorderScroll(inSender, inEvent);
		}
		return r;
	},
	setScrollTop: function(inScrollTop) {
		this.update(inScrollTop);
		this.inherited(arguments);
		this.twiddle();
	},
	getScrollPosition: function() {
		return this.calcPos(this.getScrollTop());
	},
	setScrollPosition: function(inPos) {
		this.setScrollTop(this.calcPos(inPos));
	},
	//* @public
	//* Scrolls the list so the last item is visible.
	scrollToBottom: function() {
		this.update(this.getScrollBounds().maxTop);
		this.inherited(arguments);
	},
	//* Scrolls to the specified row.
	scrollToRow: function(inRow) {
		var page = Math.floor(inRow / this.rowsPerPage);
		var pageRow = inRow % this.rowsPerPage;
		var h = this.pageToPosition(page);
		// update the page
		this.updateForPosition(h);
		// call pageToPosition again and this time should return the right pos since the page info is populated
		h = this.pageToPosition(page);
		this.setScrollPosition(h);
		if (page == this.p0 || page == this.p1) {
			var rowNode = this.$.generator.fetchRowNode(inRow);
			if (rowNode) {
				// calc row offset
				var offset = rowNode.offsetTop;
				if (this.bottomUp) {
					offset = this.getPageHeight(page) - rowNode.offsetHeight - offset;
				}
				var y = this.getScrollPosition() + offset;
				this.setScrollPosition(y);
			}
		}
	},
	//* Scrolls to the beginning of the list.
	scrollToStart: function() {
		this[this.bottomUp ? "scrollToBottom" : "scrollToTop"]();
	},
	//* Scrolls to the end of the list.
	scrollToEnd: function() {
		this[this.bottomUp ? "scrollToTop" : "scrollToBottom"]();
	},
	//* Re-renders the list at the current position.
	refresh: function() {
		this.invalidatePages();
		this.update(this.getScrollTop());
		this.stabilize();

		//FIXME: Necessary evil for Android 4.0.4 refresh bug
		if (enyo.platform.android === 4) {
			this.twiddle();
		}
	},
	/**
		Re-renders the list from the beginning.  This is used when changing the
		data model for the list.  This also clears the selection state.
	*/
	reset: function() {
		this.getSelection().clear();
		this.invalidateMetrics();
		this.invalidatePages();
		this.stabilize();
		this.scrollToStart();
	},
	/**
		Returns the [enyo.Selection](#enyo.Selection) component that
		manages the selection state for	this list.
	*/
	getSelection: function() {
		return this.$.generator.getSelection();
	},
	/**
		Sets the selection state for the given row index.
		_inData_ is an optional data value stored in the selection object.

		Modifying selection will not automatically rerender the row,
		so use [renderRow](#enyo.List::renderRow) or [refresh](#enyo.List::refresh)
		to update the view.
	*/
	select: function(inIndex, inData) {
		return this.getSelection().select(inIndex, inData);
	},
	/**
		Clears the selection state for the given row index.

		Modifying selection will not automatically re-render the row,
		so use [renderRow](#enyo.List::renderRow) or [refresh](#enyo.List::refresh)
		to update the view.
	*/
	deselect: function(inIndex) {
		return this.getSelection().deselect(inIndex);
	},
	//* Gets the selection state for the given row index.
	isSelected: function(inIndex) {
		return this.$.generator.isSelected(inIndex);
	},
	/**
		Re-renders the specified row. Call this method after making
		modifications to a row, to force it to render.
    */
    renderRow: function(inIndex) {
		this.$.generator.renderRow(inIndex);
    },
	//* Updates row bounds when rows are re-rendered.
	rowRendered: function(inSender, inEvent) {
		this.updateRowBounds(inEvent.rowIndex);
	},
	//* Prepares the row to become interactive.
	prepareRow: function(inIndex) {
		this.$.generator.prepareRow(inIndex);
	},
	//* Restores the row to being non-interactive.
	lockRow: function() {
		this.$.generator.lockRow();
	},
	/**
		Performs a set of tasks by running the function _inFunc_ on a row (which
		must be interactive at the time the tasks are performed). Locks the	row
		when done.
	*/
	performOnRow: function(inIndex, inFunc, inContext) {
		this.$.generator.performOnRow(inIndex, inFunc, inContext);
	},
	//* @protected
	animateFinish: function(inSender) {
		this.twiddle();
		return true;
	},
	// FIXME: Android 4.04 has issues with nested composited elements; for example, a SwipeableItem,
	// can incorrectly generate taps on its content when it has slid off the screen;
	// we address this BUG here by forcing the Scroller to "twiddle" which corrects the bug by
	// provoking a dom update.
	twiddle: function() {
		var s = this.getStrategy();
		enyo.call(s, "twiddle");
	},
	
	/**
		---- Reorder functionality ------------
	*/

	//* Determines whether we should handle the hold event as a reorder hold.
	shouldDoReorderHold: function(inSender, inEvent) {
		if(!this.getReorderable() || !(inEvent.rowIndex >= 0) || this.pinnedReorderMode ||
			inSender !== this.$.strategy || !(inEvent.index >= 0)) {
			return false;
		}
		return true;
	},
	//* Processes hold event and prepares for reordering.
	reorderHold: function(inEvent) {
		// disable drag to scroll on strategy
		this.$.strategy.listReordering = true;
		
		this.buildReorderContainer();
		this.doSetupReorderComponents(inEvent);
		this.styleReorderContainer(inEvent);
		
		this.draggingRowIndex = this.placeholderRowIndex = inEvent.rowIndex;
		this.itemMoved = false;
		this.initialPageNumber = this.currentPageNumber = Math.floor(inEvent.rowIndex/this.rowsPerPage);
		this.currentPage = this.currentPageNumber%2;
		this.prevScrollTop = this.getScrollTop();

		// fill row being reordered with placeholder
		this.replaceNodeWithPlaceholder(inEvent.rowIndex);
	},
	/**
		Fills reorder container with draggable reorder components defined by the
		application.
	*/
	buildReorderContainer: function() {
		this.$.reorderContainer.destroyClientControls();
		for(var i=0;i<this.reorderComponents.length;i++) {
			this.$.reorderContainer.createComponent(this.reorderComponents[i], {owner:this.owner});
		}
		this.$.reorderContainer.render();
	},
	//* Prepares floating reorder container.
	styleReorderContainer: function(e) {
		this.setItemPosition(this.$.reorderContainer, e.rowIndex);
		this.setItemBounds(this.$.reorderContainer, e.rowIndex);
		//this.appendNodeToReorderContainer(this.cloneRowNode(e.rowIndex));
		this.$.reorderContainer.setShowing(true);
		this.centerReorderContainerOnPointer(e);
	},
	//* Copies the innerHTML of _node_ into a new component inside of
	//* _reorderContainer_.
	appendNodeToReorderContainer: function(node) {
		this.$.reorderContainer.createComponent({allowHtml: true, content: node.innerHTML}).render();
	},
	//* Centers the floating reorder container on the user's pointer.
	centerReorderContainerOnPointer: function(e) {
		var containerPosition = this.getNodePosition(this.hasNode());
		var x = e.pageX - containerPosition.left - parseInt(this.$.reorderContainer.domStyles.width)/2;
		var y = e.pageY - containerPosition.top + this.getScrollTop() - parseInt(this.$.reorderContainer.domStyles.height)/2;
		if(this.getStrategyKind() != "ScrollStrategy") {
			x -= this.getScrollLeft();
			y -= this.getScrollTop();
		}
		this.positionReorderContainer(x,y);
	},
	/**
		Moves the reorder container to the specified _x_ and _y_ coordinates.
		Animates and kicks off timer to turn off animation.
	*/
	positionReorderContainer: function(x,y) {
		this.$.reorderContainer.addClass("enyo-animatedTopAndLeft");
		this.$.reorderContainer.addStyles("left:"+x+"px;top:"+y+"px;");
		this.setPositionReorderContainerTimeout();
	},
	setPositionReorderContainerTimeout: function() {
		var _this = this;
		this.clearPositionReorderContainerTimeout();
		this.positionReorderContainerTimeout = setTimeout(function() {
			_this.$.reorderContainer.removeClass("enyo-animatedTopAndLeft");
			_this.clearPositionReorderContainerTimeout();
		}, 100);
	},
	clearPositionReorderContainerTimeout: function() {
		if(this.positionReorderContainerTimeout) {
			clearTimeout(this.positionReorderContainerTimeout);
			this.positionReorderContainerTimeout = null;
		}
	},
	//* Determines whether we should handle the drag event.
	shouldDoReorderDrag: function(inEvent) {
		if(!this.getReorderable() || this.draggingRowIndex < 0 || this.pinnedReorderMode) {
			return false;
		}
		return true;
	},
	//* Handles the drag event as a reorder drag.
	reorderDrag: function(inEvent) {
		// position reorder node under mouse/pointer
		this.positionReorderNode(inEvent);

		// determine if we need to auto-scroll the list
		this.checkForAutoScroll(inEvent);

		// if the current index the user is dragging over has changed, move the placeholder
		var index = this.getRowIndexFromCoordinate(inEvent.pageY);
		if(index !== -1 && index != this.placeholderRowIndex) {
			this.movePlaceholderToIndex(index);
		}
	},
	//* Positions the reorder node based on the dx and dy of the drag event.
	positionReorderNode: function(e) {
		var reorderNodeStyle = this.$.reorderContainer.hasNode().style;
		var left = parseInt(reorderNodeStyle.left) + e.ddx;
		var top = parseInt(reorderNodeStyle.top) + e.ddy;
		top = (this.getStrategyKind() == "ScrollStrategy") ? top + (this.getScrollTop() - this.prevScrollTop) : top;
		this.$.reorderContainer.addStyles("top: "+top+"px ; left: "+left+"px");
		this.prevScrollTop = this.getScrollTop();
	},
	/**
		Checks if the list should scroll when dragging and, if so, starts the
		scroll timeout timer. Auto-scrolling happens when the user drags an item
		within the top/bottom boundary percentage defined in
		_this.dragToScrollThreshold_.
	*/
	checkForAutoScroll:function(inEvent) {
		var position = this.getNodePosition(this.hasNode());
		var bounds = this.getBounds();
		var perc;
		if(inEvent.pageY - position.top < bounds.height * this.dragToScrollThreshold) {
			perc = 100*(1 - ((inEvent.pageY - position.top) / (bounds.height * this.dragToScrollThreshold)));
			this.scrollDistance = -1*perc;
		} else if(inEvent.pageY - position.top > bounds.height * (1 - this.dragToScrollThreshold)) {
			perc = 100*((inEvent.pageY - position.top - bounds.height*(1 - this.dragToScrollThreshold)) / (bounds.height - (bounds.height * (1 - this.dragToScrollThreshold))));
			this.scrollDistance = 1*perc;
		} else {
			this.scrollDistance = 0;
		}
		// stop scrolling if distance is zero (i.e., user isn't scrolling to the edges of
		// the list); otherwise, start it if not already started
		if (this.scrollDistance === 0) {
			this.stopAutoScrolling();
		} else {
			if(!this.autoScrollTimeout) {
				this.startAutoScrolling();
			}
		}
	},
	//* Stops auto-scrolling.
	stopAutoScrolling: function() {
		if(this.autoScrollTimeout) {
			clearTimeout(this.autoScrollTimeout);
			this.autoScrollTimeout = null;
		}
	},
	//* Starts auto-scrolling.
	startAutoScrolling: function() {
		this.autoScrollTimeout = setTimeout(enyo.bind(this,this.autoScroll), this.autoScrollTimeoutMS);
	},
	//* Scrolls the list by the distance specified in _this.scrollDistance_.
	autoScroll:function() {
		if(this.scrollDistance === 0) {
			this.stopAutoScrolling();
		} else {
			if(!this.autoScrollTimeout) {
				this.startAutoScrolling();
			}
		}
		this.setScrollPosition(this.getScrollPosition() + this.scrollDistance);
		this.positionReorderNode({ddx: 0, ddy: 0});
		this.startAutoScrolling();
	},
	/**
		Moves the placeholder (i.e., the gap between rows) to the row currently
		under the user's pointer. This provides a visual cue, showing the user
		where the item being dragged will go if it is dropped.
	*/
	movePlaceholderToIndex: function(index) {
		var node = this.$.generator.fetchRowNode(index);
		// safety first
		if(!node) {
			enyo.log("No node - "+index);
			return;
		}

		// figure next page and position for placeholder
		var newPlaceholderIndex = (index > this.draggingRowIndex) ? index + 1 : index;
		var nextPageNumber = Math.floor(newPlaceholderIndex/this.rowsPerPage);
		var nextPage = nextPageNumber%2;

		// don't add pages beyond the original page count
		if(nextPageNumber >= this.pageCount) {
			nextPageNumber = this.currentPageNumber;
			nextPage = this.currentPage;
		}

		// if moving to same page, simply move the placeholder to new position
		if(this.currentPage == nextPage) {
			this.$["page"+this.currentPage].hasNode().insertBefore(this.placeholderNode, this.$.generator.fetchRowNode(newPlaceholderIndex));
		// if moving to different page, recalculate page heights and reposition pages
		} else {
			this.$["page"+nextPage].hasNode().insertBefore(this.placeholderNode, this.$.generator.fetchRowNode(newPlaceholderIndex));
			this.updatePageHeight(this.currentPageNumber, this.$["page"+this.currentPage]);
			this.updatePageHeight(nextPageNumber, this.$["page"+nextPage]);
			this.updatePagePositions(nextPageNumber,nextPage);
		}

		// save updated state
		this.placeholderRowIndex = index;
		this.currentPageNumber = nextPageNumber;
		this.currentPage = nextPage;

		// remember that we moved an item (to prevent pinning at the wrong time)
		this.itemMoved = true;
	},
	/**
		Turns off reordering. If the user didn't drag the item being reordered
		outside of its original position, goes into pinned reorder mode.
	*/
	finishReordering: function(inSender, inEvent) {
		if(this.draggingRowIndex < 0 || this.pinnedReorderMode) {
			return;
		}

		var _this = this;

		this.stopAutoScrolling();

		// enable drag-scrolling on strategy
		this.$.strategy.listReordering = false;

		// animate reorder container to proper position and then complete
		// reordering actions
		this.moveReorderedContainerToDroppedPosition(inEvent);
		setTimeout(function() { _this.completeFinishReordering(inEvent); }, 100);

		inEvent.preventDefault();
		return true;
	},
	//*
	moveReorderedContainerToDroppedPosition: function() {
		var offset = this.getRelativeOffset(this.placeholderNode, this.hasNode());
		var top = (this.getStrategyKind() == "ScrollStrategy") ? offset.top : offset.top - this.getScrollTop();
		var left = offset.left - this.getScrollLeft();
		this.positionReorderContainer(left,top);
	},
	/**
		After the reordered item has been animated to its position, completes
		the reordering logic.
	*/
	completeFinishReordering: function(inEvent) {
		// if the user dropped the item in the same location where it was picked up, and they
		// didn't move any other items in the process, pin the item and go into pinned reorder mode
		if(this.draggingRowIndex == this.placeholderRowIndex && !this.pinnedReorderMode) {
			if(!this.itemMoved) {
				this.beginPinnedReorder(inEvent);
				return;
			}
			// release the row being reordered
			this.dropReorderedRow(inEvent);
		}
		this.removePlaceholderNode();
		this.dropReorderedRow(inEvent);
		this.reorderRows(inEvent);
		this.resetReorderState();
		this.refresh();
	},
	//* Go into pinned reorder mode
	beginPinnedReorder: function(e) {
		this.buildPinnedReorderContainer();
		this.doSetupPinnedReorderComponents(enyo.mixin(e, {index: this.draggingRowIndex}));
		this.pinnedReorderMode = true;
		this.initialPinPosition = e.pageY;
	},
	//* Clears contents of reorder container, then hides.
	emptyAndHideReorderContainer: function() {
		this.$.reorderContainer.destroyComponents();
		this.$.reorderContainer.setShowing(false);
	},
	//* Fills reorder container with pinned controls.
	buildPinnedReorderContainer: function() {
		this.$.reorderContainer.destroyClientControls();
		for(var i=0;i<this.pinnedReorderComponents.length;i++) {
			this.$.reorderContainer.createComponent(this.pinnedReorderComponents[i], {owner:this.owner});
		}
		this.$.reorderContainer.render();
	},
	//* Puts away reorder container and bubbles a reorder event.
	dropReorderedRow: function(e) {
		this.emptyAndHideReorderContainer();
		this.positionReorderedNode();
	},
	//* Swaps the rows that were reordered, and sends up reorder event.
	reorderRows: function(inEvent) {
		// send reorder event
		this.doReorder(this.makeReorderEvent(inEvent));
		// update page heights if necessary
		if(this.shouldMoveItemtoDiffPage()) {
			this.moveItemToDiffPage();
		}
		// fix indices for reordered rows
		this.updateListIndices();
	},
	//* Adds _reorderTo_ and _reorderFrom_ properties to the reorder event.
	makeReorderEvent: function(e) {
		e.reorderFrom = this.draggingRowIndex;
		e.reorderTo = this.placeholderRowIndex;
		return e;
	},
	//* Returns true if user dragged an item to a different page.
	shouldMoveItemtoDiffPage: function() {
		return (this.currentPageNumber != this.initialPageNumber);
	},
	//* Moves the given item from one page to the next.
	moveItemToDiffPage: function() {
		var mover, movee;
		var otherPage = (this.currentPage == 1) ? 0 : 1;
		// if moved down, move current page's firstChild to the end of previous page
		if(this.initialPageNumber < this.currentPageNumber) {
			mover = this.$["page"+this.currentPage].hasNode().firstChild;
			this.$["page"+otherPage].hasNode().appendChild(mover);
		// if moved up, move current page's lastChild before previous page's firstChild
		} else {
			mover = this.$["page"+this.currentPage].hasNode().lastChild;
			movee = this.$["page"+otherPage].hasNode().firstChild;
			this.$["page"+otherPage].hasNode().insertBefore(mover, movee);
		}
		this.updatePagePositions(this.initialPageNumber,otherPage);
	},
	//* Moves the node being reordered to its new position and shows it.
	positionReorderedNode: function() {
		var insertIndex = (this.placeholderRowIndex > this.draggingRowIndex) ? this.placeholderRowIndex+1 : this.placeholderRowIndex;
		var insertNode = this.$.generator.fetchRowNode(insertIndex);
		this.$["page"+this.currentPage].hasNode().insertBefore(this.hiddenNode, insertNode);
		this.showNode(this.hiddenNode);
	},
	//* Resets to original values.
	resetReorderState: function() {
		this.draggingRowIndex = this.placeholderRowIndex = -1;
		this.holding = false;
		this.pinnedReorderMode = false;
	},
	//* Updates indices of list items as needed to preserve reordering.
	updateListIndices: function() {
		// don't do update if we've moved further than one page, refresh instead
		if(this.shouldDoRefresh()) {
			this.refresh();
			return;
		}

		var from = Math.min(this.draggingRowIndex, this.placeholderRowIndex);
		var to = Math.max(this.draggingRowIndex, this.placeholderRowIndex);
		var delta = (this.draggingRowIndex - this.placeholderRowIndex > 0) ? 1 : -1;
		var node, i, newIndex, currentIndex;

		if(delta === 1) {
			node = this.$.generator.fetchRowNode(this.draggingRowIndex);
			node.setAttribute("data-enyo-index", "reordered");
			for(i=(to-1),newIndex=to;i>=from;i--) {
				node = this.$.generator.fetchRowNode(i);
				if(!node) {
					enyo.log("No node - "+i);
					continue;
				}
				currentIndex = parseInt(node.getAttribute("data-enyo-index"));
				newIndex = currentIndex + 1;
				node.setAttribute("data-enyo-index", newIndex);
			}
			node = document.querySelectorAll('[data-enyo-index="reordered"]')[0];
			node.setAttribute("data-enyo-index", this.placeholderRowIndex);

		} else {
			node = this.$.generator.fetchRowNode(this.draggingRowIndex);
			node.setAttribute("data-enyo-index", this.placeholderRowIndex);
			for(i=(from+1), newIndex=from;i<=to;i++) {
				node = this.$.generator.fetchRowNode(i);
				if(!node) {
					enyo.log("No node - "+i);
					continue;
				}
				currentIndex = parseInt(node.getAttribute("data-enyo-index"));
				newIndex = currentIndex - 1;
				node.setAttribute("data-enyo-index", newIndex);
			}
		}
	},
	//* Determines if an item was reordered far enough that it warrants a refresh.
	shouldDoRefresh: function() {
		return (Math.abs(this.initialPageNumber - this.currentPageNumber) > 1);
	},
	//* Gets node height, width, top, and left values.
	getNodeStyle: function(index) {
		var node = this.$.generator.fetchRowNode(index);
		if(!node) {
			enyo.log("No node - "+index);
			return;
		}
		var offset = this.getRelativeOffset(node, this.hasNode());
		var dimensions = this.getDimensions(node);
		return {h: parseInt(dimensions.height), w: parseInt(dimensions.width), left: parseInt(offset.left), top: parseInt(offset.top)};
	},
	//* Gets offset relative to a positioned ancestor node.
	getRelativeOffset: function (n, p) {
		var ro = {top: 0, left: 0};
		if (n !== p && n.parentNode) {
			do {
				ro.top += n.offsetTop || 0;
				ro.left += n.offsetLeft || 0;
				n = n.offsetParent;
			} while (n && n !== p);
		}
		return ro;
	},
	//* Gets height and width of the given DOM node.
	getDimensions: function(node) {
		var style = window.getComputedStyle(node,null);
		return {height: style.getPropertyValue("height"), width: style.getPropertyValue("width")};
	},
	replaceNodeWithPlaceholder: function(index) {
		var node = this.$.generator.fetchRowNode(index);
		if(!node) {
			enyo.log("No node - "+index);
			return;
		}
		// create and style placeholder node
		this.placeholderNode = this.createPlaceholderNode(node);
		// hide existing node
		this.hiddenNode = this.hideNode(node);
		// insert placeholder node where original node was
		this.$["page"+this.currentPage].hasNode().insertBefore(this.placeholderNode,this.hiddenNode);
	},
	/**
		Creates and returns a placeholder node with dimensions matching those of
		the passed-in node.
	*/
	createPlaceholderNode: function(node) {
		var placeholderNode = this.$.placeholder.hasNode().cloneNode(true);
		var nodeDimensions = this.getDimensions(node);
		placeholderNode.style.height = nodeDimensions.height;
		placeholderNode.style.width = nodeDimensions.width;
		return placeholderNode;
	},
	//* Removes the placeholder node from the DOM.
	removePlaceholderNode: function() {
		this.removeNode(this.placeholderNode);
		this.placeholderNode = null;
	},
	//* Removes the hidden node from the DOM.
	removeHiddenNode: function() {
		this.removeNode(this.hiddenNode);
		this.hiddenNode = null;
	},
	//* Removes the passed-in node from the DOM.
	removeNode: function(node) {
		if(!node || !node.parentNode) {
			return;
		}
		node.parentNode.removeChild(node);
	},
	/**
		Updates _this.pageHeights_ to support the placeholder node's jumping
		from one page to the next.
	*/
	updatePageHeight: function(pageNumber, pageDOMElement) {
		var pageHeight = pageDOMElement.getBounds().height;
		this.pageHeights[pageNumber] = pageHeight;
	},
	/**
		Repositions the two passed-in pages to support the placeholder node's
		jumping from one page to the next.
	*/
	updatePagePositions: function(nextPageNumber,nextPage) {
		this.positionPage(this.currentPageNumber, this.$["page"+this.currentPage]);
		this.positionPage(nextPageNumber, this.$["page"+nextPage]);
	},
	//* Corrects page heights array after reorder is complete.
	correctPageHeights: function() {
		var initPageNumber = this.initialPageNumber%2;
		this.updatePageHeight(this.currentPageNumber, this.$["page"+this.currentPage]);
		if(initPageNumber != this.currentPageNumber) {
			this.updatePageHeight(this.initialPageNumber, this.$["page"+initPageNumber]);
		}
	},
	hideNode: function(node) {
		node.style.display = "none";
		return node;
	},
	showNode: function(node) {
		node.style.display = "block";
		return node;
	},
	//* Called when the "Drop" button is pressed on the pinned placeholder row.
	dropPinnedRow: function(inEvent) {
		var _this = this;
		// animate reorder container to proper position and then complete reording actions
		this.moveReorderedContainerToDroppedPosition(inEvent);
		setTimeout(function() { _this.completeFinishReordering(inEvent); }, 100);
		return;
	},
	//* Returns the row index that is under the given position on the page.
	getRowIndexFromCoordinate: function(y) {
		var cursorPosition = this.getScrollTop() + y - this.getNodePosition(this.hasNode()).top;
		var pageInfo = this.positionToPageInfo(cursorPosition);
		var rows = (pageInfo.no == this.p0) ? this.p0RowBounds : this.p1RowBounds;
		// might have only rendered one page, so catch that here
		if (!rows) {
			return -1;
		}
		var posOnPage = pageInfo.pos;
		var placeholderHeight = parseInt(window.getComputedStyle(this.placeholderNode).height);
		for(var i=0, totalHeight=0;i<rows.length;i++) {
			totalHeight += (rows[i].height > 0) ? rows[i].height : placeholderHeight;
			if(totalHeight >= posOnPage) {
				return parseInt(rows[i].index);
			}
		}
		return -1;
	},
	//* Gets the position of a node (identified via index) on the page.
	getIndexPosition: function(index) {
		return this.getNodePosition(this.$.generator.fetchRowNode(index));
	},
	//* Gets the position of a node on the page, taking translations into account.
	getNodePosition:function(node) {
		var originalNode=node;
		var offsetTop=0;
		var offsetLeft=0;
		while(node && node.offsetParent){
			offsetTop+=node.offsetTop;
			offsetLeft+=node.offsetLeft;
			node=node.offsetParent;
		}
		// second pass to get transforms
		node=originalNode;
		var cssTransformProp=enyo.dom.getCssTransformProp();
		while(node && node.getAttribute){
			var matrix=enyo.dom.getComputedStyleValue(node,cssTransformProp);
			if(matrix && matrix != "none"){
				var last=matrix.lastIndexOf(",");
				var secondToLast=matrix.lastIndexOf(",",last-1);
				if(last>=0 && secondToLast>=0){
					offsetTop+=parseFloat(matrix.substr(last+1,matrix.length-last));
					offsetLeft+=parseFloat(matrix.substr(secondToLast+1,last-secondToLast));
				}
			}
			node=node.parentNode;
		}
		return {top:offsetTop,left:offsetLeft};
	},
	cloneRowNode: function(index) {
		return this.$.generator.fetchRowNode(index).cloneNode(true);
	},
	//* Sets _$item_'s position to match that of the list row at _index_.
	setItemPosition: function($item,index) {
		var clonedNodeStyle = this.getNodeStyle(index);
		var top = (this.getStrategyKind() == "ScrollStrategy") ? clonedNodeStyle.top : clonedNodeStyle.top - this.getScrollTop();
		var styleStr = "top:"+top+"px; left:"+clonedNodeStyle.left+"px;";
		$item.addStyles(styleStr);
	},
	//* Sets _$item_'s width and height to match those of the list row at _index_.
	setItemBounds: function($item,index) {
		var clonedNodeStyle = this.getNodeStyle(index);
		var styleStr = "width:"+clonedNodeStyle.w+"px; height:"+clonedNodeStyle.h+"px;";
		$item.addStyles(styleStr);
	},
	//* Determines whether we should do a pinned reorder with this scroll event.
	shouldDoPinnedReorderScroll: function() {
		if(!this.getReorderable() || !this.pinnedReorderMode) {
			return false;
		}
		return true;
	},
	/**
		When in pinned reorder mode, repositions the pinned placeholder when the
		user has scrolled far enough.
	*/
	reorderScroll: function(inSender, e) {
		// if we are using the standard scroll strategy, we have to move the pinned row with the scrolling
		if(this.getStrategyKind() == "ScrollStrategy") {
			this.$.reorderContainer.addStyles("top:"+(this.initialPinPosition+this.getScrollTop()-this.rowHeight)+"px;");
		}
		var index = this.getRowIndexFromCoordinate(this.initialPinPosition);
		if(index != this.placeholderRowIndex) {
			this.movePlaceholderToIndex(index);
		}
	},
	hideReorderingRow: function() {
		var hiddenNode = document.querySelectorAll('[data-enyo-index="'+this.draggingRowIndex+'"]')[0];
		// hide existing node
		if(hiddenNode) {
			this.hiddenNode = this.hideNode(hiddenNode);
		}
	},
	isReordering: function() {
		return (this.draggingRowIndex > -1);
	},
	
	/**
		---- Swipeable functionality ------------
	*/
	
	/**
		When a drag starts, gets the direction of the drag as well as the index
		of the item being dragged, and resets any pertinent values. Then kicks
		off the swipe sequence.
	*/
	swipeDragStart: function(inSender, inEvent) {
		// if no swipeable components are defined, or this is a vertical drag,
		// don't do swipe actions
		if(!this.hasSwipeableComponents() || inEvent.vertical || this.draggingRowIndex > -1) {
			return false;
		}
		
		// save direction we are swiping
		this.setSwipeDirection(inEvent.xDirection);
		
		// if we are waiting to complete a swipe, complete it
		if(this.completeSwipeTimeout) {
			this.completeSwipe(inEvent);
		}
		
		// reset flicked flag
		this.setFlicked(false);
		// reset swipe complete flag
		this.setSwipeComplete(false);
		
		// if user is dragging a different item than was dragged previously, hide all swipeables first
		if(this.swipeIndexChanged(inEvent.index)) {
			this.clearSwipeables();
			this.setSwipeIndex(inEvent.index);
		}
		
		// start swipe sequence only if we are not currently showing a persistent item
		if(!this.persistentItemVisible) {
			this.startSwipe(inEvent);
		}
		
		// reset dragged distance (for dragfinish)
		this.draggedXDistance = 0;
		this.draggedYDistance = 0;
		
		return true;
	},
	shouldDoSwipeDrag: function() {
		return (this.getEnableSwipe() && !this.isReordering());
	},
	/**
		When a drag is in progress, updates the position of the swipeable
		container based on the ddx of the event.
	*/
	swipeDrag: function(inSender, inEvent) {
		// if dragged out of bounds, stop swipe
		if(this.draggedOutOfBounds(inEvent)) {
			this.swipeDragFinish(inEvent);
			return this.preventDragPropagation;
		}
		// if a persistent swipeableItem is still showing, handle it separately
		if(this.persistentItemVisible) {
			this.dragPersistentItem(inEvent);
			return this.preventDragPropagation;
		}
		// apply new position
		this.dragSwipeableComponents(this.calcNewDragPosition(inEvent.ddx));
		// save dragged distance (for dragfinish)
		this.draggedXDistance = inEvent.dx;
		this.draggedYDistance = inEvent.dy;
		
		return this.preventDragPropagation;
	},
	//* Don't do swipe flick if user is currently reordering.
	shouldDoSwipeFlick: function() {
		return (!this.isReordering());
	},
	//* When the user flicks, completes the swipe.
	swipeFlick: function(inSender, inEvent) {
		// if swiping is disabled, return early
		if(!this.getEnableSwipe()) {
			return false;
		}
		
		// if the flick was vertical, return early
		if(Math.abs(inEvent.xVelocity) < Math.abs(inEvent.yVelocity)) {
			return false;
		}
		
		// prevent the dragFinish event from breaking the flick
		this.setFlicked(true);
		
		// if a persistent swipeableItem is still showing, slide it away or bounce it
		if(this.persistentItemVisible) {
			this.flickPersistentItem(inEvent);
			return true;
		}

		// do swipe
		this.swipe(this.normalSwipeSpeedMS);

		return true;
	},
	/*
		When the current drag completes, decides whether to complete the swipe
		based on how far the user pulled the swipeable container. If a flick
		occurred, dragFinish is not processed.
	*/
	swipeDragFinish: function(inSender, inEvent) {
		// if swiping is disabled, return early
		if(!this.getEnableSwipe()) {
			return this.preventDragPropagation;
		}
		// if a flick happened or the drag was more vertical than horizontal, don't do dragFinish
		if(this.wasFlicked()) {
			return this.preventDragPropagation;
		}
		
		// if a persistent swipeableItem is still showing, complete drag away or bounce
		if(this.persistentItemVisible) {
			this.dragFinishPersistentItem(inEvent);
		// otherwise if user dragged more than 20% of the width, complete the swipe. if not, back out.
		} else {
			if(this.calcPercentageDragged(this.draggedXDistance) > this.percentageDraggedThreshold) {
				this.swipe(this.fastSwipeSpeedMS);
			} else {
				this.backOutSwipe(inEvent);
			}
		}
		
		return this.preventDragPropagation;
	},
	hasSwipeableComponents: function() {
		return this.$.swipeableComponents.controls.length !== 0;
	},
	// Positions the swipeable components block at the current row.
	positionSwipeableContainer: function(index,xDirection) {
		var node = this.$.generator.fetchRowNode(index);
		if(!node) {
			return;
		}
		var offset = this.getRelativeOffset(node, this.hasNode());
		var dimensions = this.getDimensions(node);
		var x = (xDirection == 1) ? -1*parseInt(dimensions.width) : parseInt(dimensions.width);
		this.$.swipeableComponents.addStyles("top: "+offset.top+"px; left: "+x+"px; height: "+dimensions.height+"; width: "+dimensions.width);
	},
	setSwipeDirection: function(xDirection) {
		this.swipeDirection = xDirection;
	},
	setFlicked: function(flicked) {
		this.flicked = flicked;
	},
	wasFlicked: function() {
		return this.flicked;
	},
	setSwipeComplete: function(complete) {
		this.swipeComplete = complete;
	},
	swipeIndexChanged: function(index) {
		return (this.swipeIndex === null) ? true : (index === undefined) ? false : (index !== this.swipeIndex);
	},
	setSwipeIndex: function(index) {
		this.swipeIndex = (index === undefined) ? this.swipeIndex : index;
	},
	/**
		Calculates new position for the swipeable container based on the user's
		drag action. Don't allow the container to drag beyond either edge.
	*/
	calcNewDragPosition: function(dx) {
		var parentStyle = window.getComputedStyle(this.$.swipeableComponents.hasNode());
		if(!parentStyle) {
			return false;
		}
		var xPos = parseInt(parentStyle["left"]);
		var dimensions = this.getDimensions(this.$.swipeableComponents.node);
		var xlimit = (this.swipeDirection == 1) ? 0 : -1*parseInt(dimensions.width);
		var x = (this.swipeDirection == 1)
			? (xPos + dx > xlimit)
				? xlimit
				: xPos + dx
			: (xPos + dx < xlimit)
				? xlimit
				: xPos + dx;
		return x;
	},
	dragSwipeableComponents: function(x) {
		this.$.swipeableComponents.applyStyle("left",x+"px");
	},
	draggedOutOfBounds:function(inEvent) {
		var position = this.getNodePosition(this.hasNode());
		var bounds = this.getBounds();
		var oobT = (inEvent.pageY - position.top < 0);
		var oobB = (inEvent.pageY - position.top > bounds.height);
		var oobL = (inEvent.pageX - position.left < 0);
		var oobR = (inEvent.pageX - position.left > bounds.width);
		return oobT || oobB || oobL || oobR;
	},
	/**
		Begins swiping sequence by positioning the swipeable container and
		bubbling the setupSwipeItem event.
	*/
	startSwipe: function(e) {
		// modify event index to always have this swipeItem value
		e.index = this.swipeIndex;
		this.positionSwipeableContainer(this.swipeIndex,e.xDirection);
		this.$.swipeableComponents.setShowing(true);
		this.setPersistentItemOrigin(e.xDirection);
		this.doSetupSwipeItem(e);
	},
	// If a persistent swipeableItem is still showing, drags it away or bounces it.
	dragPersistentItem: function(e) {
		var xPos = 0;
		var x = (this.persistentItemOrigin == "right")
			? Math.max(xPos, (xPos + e.dx))
			: Math.min(xPos, (xPos + e.dx));
		this.$.swipeableComponents.applyStyle("left",x+"px");
	},
	// If a persistent swipeableItem is still showing, completes drag away or bounce.
	dragFinishPersistentItem: function(e) {
		var completeSwipe = (this.calcPercentageDragged(e.dx) > 0.2);
		var dir = (e.dx > 0) ? "right" : (e.dx < 0) ? "left" : null;
		if(this.persistentItemOrigin == dir) {
			if(completeSwipe) {
				this.slideAwayItem();
			} else {
				this.bounceItem(e);
			}
		} else {
			this.bounceItem(e);
		}
	},
	// If a persistent swipeableItem is still showing, slides it away or bounces it.
	flickPersistentItem: function(e) {
		if(e.xVelocity > 0) {
			if(this.persistentItemOrigin == "left") {
				this.bounceItem(e);
			} else {
				this.slideAwayItem();
			}
		} else if(e.xVelocity < 0) {	
			if(this.persistentItemOrigin == "right") {
				this.bounceItem(e);
			} else {
				this.slideAwayItem();
			}
		}
	},
	setPersistentItemOrigin: function(xDirection) {
		this.persistentItemOrigin = xDirection == 1 ? "left" : "right";
	},
	calcPercentageDragged: function(dx) {
		return Math.abs(dx/parseInt(window.getComputedStyle(this.$.swipeableComponents.hasNode()).width));
	},
	swipe: function(speed) {
		this.setSwipeComplete(true);
		this.animateSwipe(0,speed);
	},
	backOutSwipe: function(e) {
		var dimensions = this.getDimensions(this.$.swipeableComponents.node);
		var x = (this.swipeDirection == 1) ? -1*parseInt(dimensions.width) : parseInt(dimensions.width);
		this.animateSwipe(x,this.fastSwipeSpeedMS);
		this.setSwipeDirection(null);
		this.setFlicked(true);
	},
	bounceItem: function(e) {
		var style = window.getComputedStyle(this.$.swipeableComponents.node);
		if(parseInt(style.left) != parseInt(style.width)) {
			this.animateSwipe(0,this.normalSwipeSpeedMS);
		}
	},
	slideAwayItem: function() {
		var $item = this.$.swipeableComponents;
		var parentStyle = window.getComputedStyle($item.node);
		var xPos = (this.persistentItemOrigin == "left") ? -1*parseInt(parentStyle.width) : parseInt(parentStyle.width);
		this.animateSwipe(xPos,this.normalSwipeSpeedMS);
		this.persistentItemVisible = false;
		this.setPersistSwipeableItem(false);
	},
	clearSwipeables: function() {
		this.$.swipeableComponents.setShowing(false);
		this.persistentItemVisible = false;
		this.setPersistSwipeableItem(false);
	},
	// Completes swipe and hides active swipeable item.
	completeSwipe: function(e) {
		if(this.completeSwipeTimeout) {
			clearTimeout(this.completeSwipeTimeout);
			this.completeSwipeTimeout = null;
		}
		// if this wasn't a persistent item, hide it upon completion and send swipe complete event
		if(!this.getPersistSwipeableItem()) {
			this.$.swipeableComponents.setShowing(false);
			// if the swipe was completed, update the current row and bubble swipeComplete event
			if(this.swipeComplete) {
				this.doSwipeComplete({index:this.swipeIndex, xDirection:this.swipeDirection});
			}
		} else {
			this.persistentItemVisible = true;
		}
		this.setSwipeDirection(null);
	},
	animateSwipe: function(targetX,totalTimeMS) {
		var t0 = enyo.now(), t = 0;
		var $item = this.$.swipeableComponents;
		var origX = parseInt($item.domStyles.left,10);
		var xDelta = targetX - origX;
		
		this.stopAnimateSwipe();

		var fn = enyo.bind(this, function() {
			var t = enyo.now() - t0;
			var percTimeElapsed = t/totalTimeMS;
			var currentX = origX + (xDelta)*Math.min(percTimeElapsed,1);
			
			// set new left
			$item.applyStyle("left",currentX+"px");
			
			// schedule next frame
			this.job = enyo.requestAnimationFrame(fn);
			
			// potentially override animation TODO
			
			// go until we've hit our total time
			if(t/totalTimeMS >= 1) {
				this.stopAnimateSwipe();
				this.completeSwipeTimeout = setTimeout(enyo.bind(this, function() {
					this.completeSwipe();
				}), this.completeSwipeDelayMS);
			}
		});
		
		this.job = enyo.requestAnimationFrame(fn);
	},
	stopAnimateSwipe: function() {
		if(this.job) {
			this.job = enyo.cancelRequestAnimationFrame(this.job);
		}
	}
});
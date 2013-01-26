enyo.kind({
	name: "enyo.sample.ListLanguagesSample",
	kind: "FittableRows",
	classes: "list-sample-language enyo-fit",
	data: [],
	languages: {
		English: ["One",  "Two",  "Three", "Four",    "Five",      "Six",   "Seven",  "Eight", "Nine",  "Ten"],
		Italian: ["Uno",  "Due",  "Tre",   "Quattro", "Cinque",    "Sei",   "Sette",  "Otto",  "Nove",  "Dieci"],
		Spanish: ["Uno",  "Dos",  "Tres",  "Cuatro",  "Cinco",     "Seis",  "Siete",  "Ocho",  "Nueve", "Diez"],
		German:  ["Eins", "Zwei", "Drei",  "Vier",    "F&uuml;nf", "Sechs", "Sieben", "Acht",  "Neun",  "Zehn"],
		French:  ["Un",   "Deux", "Trois", "Quatre",  "Cinq",      "Six",   "Sept",   "Huit",  "Neuf",  "Dix"]
	},
	components: [
		{kind: "onyx.MoreToolbar", layoutKind: "FittableColumnsLayout", style: "height: 55px;", components: [
			{kind: "onyx.Button", content: "Randomize", ontap: "populateList"},
			{content: "Number of Rows:"},
			{kind: "onyx.InputDecorator", components: [
				{kind: "onyx.Input", value: "10", name: "numRows" }
			]}
		]},
		{kind: "List", classes: "list-sample-language-list enyo-unselectable", fit: true, multiSelect: true, reorderable: true,
			onSetupItem: "setupItem",
			onReorder: "listReorder",
			onSetupReorderComponents: "setupReorderComponents",
			onSetupPinnedReorderComponents: "setupPinnedReorderComponents",
			onSetupSwipeItem: "setupSwipeItem",
			onSwipeComplete: "swipeComplete",
			components: [
				{name: "item", classes: "list-sample-language-item", components: [
					{name: "text", classes: "itemLabel", allowHtml: true}
				]}
			],
			reorderComponents: [
				{name: "reorderContent", classes: "enyo-fit reorderDragger", components: [
					{name: "reorderTitle", tag: "h2", style: "text-align:center;", allowHtml: true}
				]}
			],
			pinnedReorderComponents: [
				{name: "pinnedReorderItem", classes: "enyo-fit swipeGreen", components: [
					{name: "pinnedReorderTitle", tag: "h2", allowHtml: true},
					{name: "dropButton", kind: "onyx.Button", ontap: "dropPinnedRow", content: "Drop", classes: "dropButton"}
				]}
			],
			swipeableComponents: [
				{name: "swipeItem", classes: "enyo-fit swipeGreen", components: [
					{name: "swipeTitle", classes: "swipeTitle"}
				]}
			]
		}
	],
	rendered: function() {
		this.inherited(arguments);
		this.populateList();
	},
	listReorder: function(inSender, inEvent) {
		var movedItem = enyo.clone(this.data[inEvent.reorderFrom]);
		this.data.splice(inEvent.reorderFrom,1);
		this.data.splice((inEvent.reorderTo),0,movedItem);
	},
	setupItem: function(inSender, inEvent) {
		var i = inEvent.index;
		if(!this.data[i]) {
			return;
		}
		var currentLanguage = this.data[i].langs[this.data[i].currentIndex];
		var val = this.data[i].val;
		var number = this.languages[currentLanguage][val];
		this.$.text.setContent(number);
	},
	setupReorderComponents: function(inSender, inEvent) {
		var i = inEvent.index;
		if(!this.data[i]) {
			return;
		}
		var currentLanguage = this.data[i].langs[this.data[i].currentIndex];
		var val = this.data[i].val;
		var number = this.languages[currentLanguage][val];
		this.$.reorderTitle.setContent(number);
	},
	setupPinnedReorderComponents: function(inSender, inEvent) {
		var i = inEvent.index;
		if(!this.data[i]) {
			return;
		}
		var currentLanguage = this.data[i].langs[this.data[i].currentIndex];
		var val = this.data[i].val;
		var number = this.languages[currentLanguage][val];
		this.$.pinnedReorderTitle.setContent(number);
	},
	//* Called when the "Drop" button is pressed on the pinned placeholder row
	dropPinnedRow: function(inSender, inEvent) {
		this.$.list.dropPinnedRow(inEvent);
	},
	setupSwipeItem: function(inSender, inEvent) {
		var i = inEvent.index;
		if(!this.data[i]) {
			return;
		}
		var newLang = (inEvent.xDirection == 1)
			? this.getNextLang(i)
			: this.getPrevLang(i);
		this.$.swipeTitle.setContent(this.data[i].langs[newLang]);
	},
	swipeComplete: function(inSender, inEvent) {
		var i = inEvent.index;
		this.data[i].currentIndex = (inEvent.xDirection == 1)
			? this.getNextLang(i)
			: this.getPrevLang(i);
		this.$.list.renderRow(i);
	},
	getNextLang: function(index) {
		var currentLang = this.data[index].currentIndex;
		return (currentLang + 1) % this.data[index].langs.length;
	},
	getPrevLang: function(index) {
		var currentLang = this.data[index].currentIndex;
		return (currentLang - 1 + this.data[index].langs.length) % this.data[index].langs.length;
	},
	populateList: function() {
		this.createRandomData();
		this.$.list.setCount(this.data.length);
		this.$.list.reset();
	},
	createRandomData: function() {
		var languages = this.getLanguages();
		var langs;
		var dataCount = parseInt(this.$.numRows.getValue(), 10);
		this.data = [];
		var sortFunc = function() {return 0.5 - Math.random();};
		for(var i=0;i<dataCount;i++) {
			langs = enyo.clone(languages);
			langs.sort(sortFunc);
			this.data.push({
				langs: langs,
				val: i % 10,
				currentIndex: 0
			});
		}
		this.data.sort(function() {return 0.5 - Math.random();});
	},
	getLanguages: function() {
		return enyo.keys(this.languages);
	}
});
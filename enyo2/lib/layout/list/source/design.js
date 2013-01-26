/** 
	Description to make List kind available in Ares.
*/
Palette.model.push(
	{name: "List", items: [
		{name: "List", title: "Infinite scrolling list", icon: "package_new.png", stars: 4.5, version: 2.0, blurb: "A component for very long lists",
			inline: {kind: "FittableRows", style: "height: 80px; position: relative;", padding: 4, components: [
				{style: "background-color: lightgreen; border: 1px dotted green; height: 10px;"},
				{style: "background-color: lightgreen; border: 1px dotted green; height: 10px;"},
				{style: "background-color: lightgreen; border: 1px dotted green;", fit: true, content: ". . ."},
				{style: "background-color: lightgreen; border: 1px dotted green; height: 10px;"},
				{style: "background-color: lightgreen; border: 1px dotted green; height: 10px;"}
			]},
			config: {content: "$name", isContainer: false, kind: "List", onSetupItem: "", count: 0}
		}
	]}
);

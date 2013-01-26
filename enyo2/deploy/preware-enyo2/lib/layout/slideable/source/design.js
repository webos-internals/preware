/** 
	Description to make Slideable kind available in Ares.
*/
Palette.model.push(
	{name: "Panels", items: [
		{name: "Panels", title: "Slideable sub-view", icon: "package_new.png", stars: 4.5, version: 2.0, blurb: "A component for slideable",
			inline: {kind: "FittableColumns", style: "height: 40px; position: relative;", padding: 4, components: [
				{style: "background-color: lightgreen; border: 1px dotted green; width: 20px;"},
				{style: "background-color: lightblue; border: 1px dotted blue;", fit: true},
			]},
			config: {content: "$name", isContainer: true, kind: "Slideable"}
		}
	]}
);

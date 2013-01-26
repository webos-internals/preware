/** 
	Description to make Panels kind available in Ares.
*/
Palette.model.push(
	{name: "Panels", items: [
		{name: "CardArranger", title: "Selectable sub-view", icon: "package_new.png", stars: 4.5, version: 2.0, blurb: "A component for panels",
			inline: {kind: "FittableColumns", style: "height: 60px; position: relative;", padding: 4, components: [
				{style: "background-color: lightgreen; border: 1px dotted green; width: 20px;"},
				{style: "background-color: lightgreen; border: 1px dotted green;", fit: true},
				{style: "background-color: lightgreen; border: 1px dotted green; width: 20px;"}
			]},
			config: {content: "$name", isContainer: true, kind: "Panels", arrangerKind: "CardArranger"}
		},
		{name: "LeftRightArranger", title: "Selectable sub-view", icon: "package_new.png", stars: 4.5, version: 2.0, blurb: "A component for panels",
			inline: {kind: "FittableColumns", style: "height: 60px; position: relative;", padding: 4, components: [
				{style: "background-color: lightgreen; border: 1px dotted green; width: 20px;"},
				{style: "background-color: lightgreen; border: 1px dotted green;", fit: true},
				{style: "background-color: lightgreen; border: 1px dotted green; width: 20px;"}
			]},
			config: {content: "$name", isContainer: true, kind: "Panels", arrangerKind: "LeftRightArranger"}
		},
		{name: "CollapsingArranger", title: "Selectable sub-view", icon: "package_new.png", stars: 4.5, version: 2.0, blurb: "A component for panels",
			inline: {kind: "FittableColumns", style: "height: 60px; position: relative;", padding: 4, components: [
				{style: "background-color: lightgreen; border: 1px dotted green; width: 20px;"},
				{style: "background-color: lightgreen; border: 1px dotted green;", fit: true},
				{style: "background-color: lightgreen; border: 1px dotted green; width: 20px;"}
			]},
			config: {content: "$name", isContainer: true, kind: "Panels", arrangerKind: "CollapsibleArranger"}
		},
	]}
);

packagesModel.prototype.versionNewer = function(one, two)
{
	// if one >= two returns false
	// if one < two returns true

	// Split each string on the colon - should only be a maximum of one.
	var e1 = one.split(':');
	var e2 = two.split(':');

	// A missing epoch is equivalent to 0, return if they are different.
	if (e1.length > 1 || e2.length > 1) {
		var prefix1 = e1.length > 1 ? parseInt(e1[0], 10) : 0;
		var prefix2 = e2.length > 1 ? parseInt(e2[0], 10) : 0;
		var diff = prefix2 - prefix1;
		if (diff) return (diff > 0) ? true : false;
	}

	// Split the versions into sections on a period or hyphen.
	var v1 = e1[e1.length > 1 ? 1 : 0].split(/[.-]/);
	var v2 = e2[e2.length > 1 ? 1 : 0].split(/[.-]/);

	// Loop over the array of sections, using the largest one as the limit.
	var lastv = v1.length > v2.length ? v1.length : v2.length;

	var j;
	for (j = 0; j < lastv; j++) {

	       	// If the first version ends early, then the second is greater.
		if (j > v1.length) return true;

	       	// If the second version ends early, then the first is greater.
		if (j > v2.length) return false;

	       	// If both strings have ended, then neither is greater.
		if ((j == v1.length) && (j == v2.length)) return false;

		// Split the sections into alpha and numeric parts.
		var p1 = v1[j].match(/([^0-9]*)([0-9]*)/g);
		var p2 = v2[j].match(/([^0-9]*)([0-9]*)/g);

		// Loop over the array of parts, using the largest one as the limit.
		var lastp = p1.length > p2.length ? p1.length : p2.length;

		var m;
		for (m = 0; m < lastp; m++) {

			// If the first part ends early, then the second is greater.
			if (m > p1.length) return true;

			// If the second part ends early, then the first is greater.
			if (m > p2.length) return false;

			// If both strings have ended, then neither is greater.
			if ((m == p1.length) && (m == p2.length)) return false;

			// If part1 is alpha, and part2 is numeric, then part1 is greater.
			if (p1[m].match(/[^0-9]/) and p2[m].match(/[0-9]/))  return false;

			// If part1 is numeric, and part2 is alpha, then part2 is greater.
			if (p1[m].match(/[0-9]/) and p2[m].match(/[^0-9]/))  return true;

			// Test non-numeric parts
			if (p1[m].match(/[^0-9]/) && p2[m].match(/[^0-9]/)) {

			   // Need to loop through characters here, adding 256 if non-alpha.
			   // Return on the first difference between the characters in the part.

			}

			// Test numeric parts
			if (p1[m].match(/[0-9]/) && p2[m].match(/[0-9]/)) {

			   // Calculate the values of the two sections.
			   var i1 = parseInt(p1[m], 10);
			   var i2 = parseInt(p2[m], 10);

			   // Return if the calculated values of the sections are different.
			   var diff = i2 - i1;
			   if (diff) return (diff > 0) ? true : false;
			}
		}
	}

	return false;
}


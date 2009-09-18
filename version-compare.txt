// Here is the annotated C code for version comparisons of the part after the colon.
// (the part before the colon is easy, cause it's just an integer)

// ([0-9]+:)?([^0-9]*[0-9]*)*([.-]([^0-9]*[0-9]*)*)*

int verrevcmp(const char *val, const char *ref)
{
     int vc, rc;
     long vl, rl;
     const char *vp, *rp;
     const char *vsep, *rsep;
    
     // Ensure we start with valid strings that we can traverse.
     if (!val) val= "";
     if (!ref) ref= "";

     // Loop through the various section of the version string, which are delimited by '.' or '-'.
     for (;;) {

          // Find the next digit in the section, and record it's location.
	  vp= val;  while (*vp && !isdigit(*vp)) vp++;
	  rp= ref;  while (*rp && !isdigit(*rp)) rp++;

	  // Loop through the non-digit prefixes.
	  for (;;) {

	       // Check the ascii value of each positionally-related character.
	       vc= (val == vp) ? 0 : *val++;
	       rc= (ref == rp) ? 0 : *ref++;

	       // Break if the end of both prefixes has been reached.
	       if (!rc && !vc) break;

	       // Adjust the lexical comparison so all letters sort earlier than non-letters.
	       if (vc && !isalpha(vc)) vc += 256; /* assumes ASCII character set */
	       if (rc && !isalpha(rc)) rc += 256;

	       // As soon as there is a mismatch, report the comparison.
	       if (vc != rc) return vc - rc;
	  }

	  // Continue the comparison at the next digit of the section.
	  val= vp;
	  ref= rp;

	  // Compare the numeric values of the digit sequences.
	  vl=0;  if (isdigit(*vp)) vl= strtol(val,(char**)&val,10);
	  rl=0;  if (isdigit(*rp)) rl= strtol(ref,(char**)&ref,10);

	  // As soon as there is a mismatch, report the comparison.
	  if (vl != rl) return vl - rl;

	  // If one string has reached the end of the section first, report the comparison.
	  vc = *val;
	  rc = *ref;
	  vsep = strchr(".-", vc);
	  rsep = strchr(".-", rc);
	  if (vsep && !rsep) return -1;
	  if (!vsep && rsep) return +1;

	  // If either string is exhausted, report the comparison.
	  if (!*val && !*ref) return 0;
	  if (!*val) return -1;
	  if (!*ref) return +1;
     }
}

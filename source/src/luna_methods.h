/*=============================================================================
 Copyright (C) 2009 Ryan Hope <rmh3093@gmail.com>
 Copyright (C) 2010 WebOS Internals <support@webos-internals.org>

 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 =============================================================================*/

#ifndef LUNA_METHODS_H_
#define LUNA_METHODS_H_

#include <lunaservice.h>

bool register_methods(LSPalmService *serviceHandle, LSError lserror);

// Buffer for command output.  Commands are read a line at a time, and the
// worst case for escaping a line is six bytes out per byte in (\u00xx), so
// this has room for any MAXLINLEN line several times over.
#define MAXBUFLEN 8193
// Size of file chunks to pass back up to webOS.  Every chunk costs a luna
// round trip and a JSON parse on the webOS side, and the feed lists run to
// well over a megabyte, so this wants to be big.  The buffers that hold an
// escaped chunk are sized from it rather than from MAXBUFLEN.
#define CHUNKSIZE 16384
// Worst case size of a chunk once escaped, plus a terminating null.
#define ESCCHUNKSIZE (CHUNKSIZE*6+1)
// Max size of any text line in a config file and elsewhere.
#define MAXLINLEN 1024
// Max size of a version number or size string.
#define MAXNUMLEN   32

#endif /* LUNA_METHODS_H_ */

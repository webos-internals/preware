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

// Twice the chunk size (so any character can be escaped), plus a terminating null.
#define MAXBUFLEN 8193
// Size of file chunks to pass back up to webOS.
#define CHUNKSIZE 4096
// Max size of any text line in a config file and elsewhere.
#define MAXLINLEN 1024
// Max size of a version number or size string.
#define MAXNUMLEN   32

#endif /* LUNA_METHODS_H_ */

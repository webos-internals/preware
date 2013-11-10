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

#ifndef LUNA_SERVICE_H_
#define LUNA_SERVICE_H_

#include <stdbool.h>

#include <lunaservice.h>

LSPalmService	*serviceHandle;
LSHandle	*pub_serviceHandle;
LSHandle	*priv_serviceHandle;

bool luna_service_initialize(const char *);
void luna_service_start(void);
void luna_service_cleanup(void);

#endif /* LUNA_SERVICE_H_ */

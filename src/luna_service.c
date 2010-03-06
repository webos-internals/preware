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

#include <string.h>
#include <glib.h>

#include "luna_service.h"
#include "luna_methods.h"

GMainLoop *loop = NULL;

bool luna_service_initialize(const char *dbusAddress) {

  bool returnVal = FALSE;

  LSError lserror;
  LSErrorInit(&lserror);

  loop = g_main_loop_new(NULL, FALSE);
  if (loop==NULL)
    goto end;

  returnVal = LSRegisterPalmService(dbusAddress, &serviceHandle, &lserror);
  if (returnVal) {
    pub_serviceHandle = LSPalmServiceGetPublicConnection(serviceHandle);
    priv_serviceHandle = LSPalmServiceGetPrivateConnection(serviceHandle);
  } else
    goto end;

  returnVal =  register_methods(serviceHandle, lserror);
  if (returnVal) {
    LSGmainAttachPalmService(serviceHandle, loop, &lserror);
  }

 end:
  if (LSErrorIsSet(&lserror)) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }

  return returnVal;
}

void luna_service_start() {
  g_main_loop_run(loop);
}

void luna_service_cleanup() {
}

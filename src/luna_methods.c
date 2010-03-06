/*=============================================================================
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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "luna_service.h"
#include "luna_methods.h"

#define ALLOWED_CHARS "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-"

#define API_VERSION "10"

bool dummy_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  retVal = LSMessageReply(lshandle, message, "{\"returnValue\":true}", &lserror);
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }

  return retVal;
}

bool version_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  retVal = LSMessageReply(lshandle, message, "{\"returnValue\":true,\"apiVersion\":\"" API_VERSION "\"}", &lserror);
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }

  return retVal;
}

bool get_configs_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char line[MAXLINELEN];
  // %%% MAGIC NUMBERS ALERT %%%
  char name[128];

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char *jsonResponse = 0;

  json_t *response = json_new_object();

  FILE *fp = popen("/bin/ls -1 /media/cryptofs/apps/etc/ipkg/", "r");
  if (fp) {
    json_t *array = json_new_array();
    while ( fgets( name, sizeof line, fp)) {
      *strchr(name,'\n') = 0;
      if (strcmp(name, "arch.conf")) {
	json_t *object = json_new_object();
	// %%% IGNORING RETURN ALERT %%%
	json_insert_pair_into_object(object, "config", json_new_string(name));
	json_insert_pair_into_object(object, "contents", json_new_string("src/gz webos-internals http://ipkg.preware.org/feeds/webos-internals/all<br>src/gz webos-internals-i686 http://ipkg.preware.org/feeds/webos-internals/i686"));
	json_insert_pair_into_object(object, "enabled", json_new_true());
	json_insert_child(array, object);
      }
    }
    if (!pclose(fp)) {
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(response, "returnValue", json_new_true());
      json_insert_pair_into_object(response, "configs", array);
      json_tree_to_string(response, &jsonResponse);
    }
  }

  json_free_value(&response);

  if (jsonResponse) {
    retVal = LSMessageReply(lshandle, message, jsonResponse, &lserror);
    free(jsonResponse);
  } else
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\":false,\"errorCode\":-1,\"errorText\":\"Internal Error\"}", &lserror);
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  return retVal;
}

bool start_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal = true;
  char line[MAXLINELEN];
  // %%% MAGIC NUMBERS ALERT %%%
  char name[128];
  char status[128];

  LSError lserror;
  LSErrorInit(&lserror);

  char *jsonResponse = 0;
  int len = 0;

  json_t *object = LSMessageGetPayloadJSON(message);

  json_t *id = json_find_first_label(object, "id");               
  if (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text)) {
    LSMessageReply(lshandle, message, "{\"returnValue\":false,\"errorCode\":-1,\"errorText\":\"Invalid id\"}", &lserror);
    LSErrorFree(&lserror);
    return true;
  }

  // %%% MAGIC NUMBERS ALERT %%%
  char command[128];
  char format[128];

  // %%% IGNORING RETURN ALERT %%%
  sprintf((char *)&command, "/sbin/initctl start %s 2>&1", id->child->text);

  json_t *response = json_new_object();

  FILE *fp = popen(command, "r");
  if (fp) {
    while ( fgets( line, sizeof line, fp)) {
      if (sscanf(line, "(%*d/%*d) Job not changed: %127s\n", (char *)&name) == 1) {
	// %%% IGNORING RETURN ALERT %%%
	json_insert_pair_into_object(response, "status", json_new_string("Job not changed"));
      }
      else if (sscanf(line, "(%*d/%*d) %s %127c\n", (char *)&name, (char *)&status) == 2) {
	// %%% HACK ALERT %%%
	*strchr(status,'\n') = 0;
	// %%% IGNORING RETURN ALERT %%%
	json_insert_pair_into_object(response, "status", json_new_string(status));
      }
    }
    if (!pclose(fp)) {
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(response, "returnValue", json_new_true());
    }
    else {
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(response, "returnValue", json_new_false());
    }
    json_tree_to_string(response, &jsonResponse);
  }

  if (jsonResponse) {
    LSMessageReply(lshandle, message, jsonResponse, &lserror);
    free(jsonResponse);
  } else
    LSMessageReply(lshandle, message, "{\"returnValue\":false,\"errorCode\":-1,\"errorText\":\"Generic error\"}", &lserror);
 
  json_free_value(&response);
  LSErrorFree(&lserror);

  return retVal;
}

bool stop_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal = true;
  char line[MAXLINELEN];
  // %%% MAGIC NUMBERS ALERT %%%
  char name[128];
  char status[128];

  LSError lserror;
  LSErrorInit(&lserror);

  char *jsonResponse = 0;
  int len = 0;

  json_t *object = LSMessageGetPayloadJSON(message);

  json_t *id = json_find_first_label(object, "id");               
  if (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text)) {
    LSMessageReply(lshandle, message, "{\"returnValue\":false,\"errorCode\":-1,\"errorText\":\"Invalid id\"}", &lserror);
    LSErrorFree(&lserror);
    return true;
  }

  // %%% MAGIC NUMBERS ALERT %%%
  char command[128];
  char format[128];

  // %%% IGNORING RETURN ALERT %%%
  sprintf((char *)&command, "/sbin/initctl stop %s 2>&1", id->child->text);

  json_t *response = json_new_object();

  FILE *fp = popen(command, "r");
  if (fp) {
    while ( fgets( line, sizeof line, fp)) {
      if (sscanf(line, "(%*d/%*d) Job not changed: %127s\n", (char *)&name) == 1) {
	// %%% IGNORING RETURN ALERT %%%
	json_insert_pair_into_object(response, "status", json_new_string("Job not changed"));
      }
      else if (sscanf(line, "(%*d/%*d) %s %127c\n", (char *)&name, (char *)&status) == 2) {
	// %%% HACK ALERT %%%
	*strchr(status,'\n') = 0;
	// %%% IGNORING RETURN ALERT %%%
	json_insert_pair_into_object(response, "status", json_new_string(status));
      }
    }
    if (!pclose(fp)) {
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(response, "returnValue", json_new_true());
    }
    else {
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(response, "returnValue", json_new_false());
    }
    json_tree_to_string(response, &jsonResponse);
  }

  if (jsonResponse) {
    LSMessageReply(lshandle, message, jsonResponse, &lserror);
    free(jsonResponse);
  } else
    LSMessageReply(lshandle, message, "{\"returnValue\":false,\"errorCode\":-1,\"errorText\":\"Generic error\"}", &lserror);
 
  json_free_value(&response);
  LSErrorFree(&lserror);

  return retVal;
}

LSMethod luna_methods[] = {
  { "status",		dummy_method },
  { "version",		version_method },
  { "getConfigs",	get_configs_method },

  { "install",		dummy_method },
  { "remove",		dummy_method },
  { "replace",		dummy_method },
  { "update",		dummy_method },
  { "rescan",		dummy_method },
  { "restartLuna",	dummy_method },
  { "restartJava",	dummy_method },
  { "restartDevice",	dummy_method },
  { "addConfig",	dummy_method },
  { "deleteConfig",	dummy_method },
  { "setConfigState",	dummy_method },
  { "getListFile",	dummy_method },
  { "getStatusFile",	dummy_method },
  { "getControlFile",	dummy_method },
  { "getAppinfoFile",	dummy_method },
  { 0, 0 }
};

bool register_methods(LSPalmService *serviceHandle, LSError lserror) {
  return LSPalmServiceRegisterCategory(serviceHandle, "/", luna_methods,
				       NULL, NULL, NULL, &lserror);
}

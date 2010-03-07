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
#include <sys/stat.h>

#include "luna_service.h"
#include "luna_methods.h"

#define ALLOWED_CHARS "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-"

#define API_VERSION "10"

char *json_escape_str(char *str)
{
  const char *json_hex_chars = "0123456789abcdef";

  char *results = (char*)malloc(8193);
  char *resultsPt = results;
  int pos = 0, start_offset = 0;
  unsigned char c;
  do {
    c = str[pos];
    switch(c) {
    case '\0':
      break;
    case '\b':
    case '\n':
    case '\r':
    case '\t':
    case '"':
    case '\\':
      if(pos - start_offset > 0)
	{memcpy(resultsPt, str + start_offset, pos - start_offset); resultsPt+=pos - start_offset;} 
    if(c == '\b')  {memcpy(resultsPt, "\\b", 2); resultsPt+=2;} 
    else if(c == '\n') {memcpy(resultsPt, "\\n", 2); resultsPt+=2;} 
    else if(c == '\r') {memcpy(resultsPt, "\\r", 2); resultsPt+=2;} 
    else if(c == '\t') {memcpy(resultsPt, "\\t", 2); resultsPt+=2;} 
    else if(c == '"') {memcpy(resultsPt, "\\\"", 2); resultsPt+=2;} 
    else if(c == '\\') {memcpy(resultsPt, "\\\\", 2); resultsPt+=2;} 
    start_offset = ++pos;
    break;
    default:
      if ((c < ' ') || (c > 127)) {
	if(pos - start_offset > 0)
	  {memcpy(resultsPt, str + start_offset, pos - start_offset); resultsPt+=pos-start_offset;} 
	sprintf(resultsPt, "\\u00%c%c",
		json_hex_chars[c >> 4],
		json_hex_chars[c & 0xf]);
	start_offset = ++pos;
      } else pos++;
    }
  } while(c);
  if(pos - start_offset > 0)
    {memcpy(resultsPt, str + start_offset, pos - start_offset); resultsPt+=pos-start_offset;} 
  memcpy(resultsPt, "\0", 1);
  return results;
}


bool dummy_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  retVal = LSMessageReply(lshandle, message, "{\"returnValue\": true}", &lserror);
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

  retVal = LSMessageReply(lshandle, message, "{\"returnValue\": true, \"apiVersion\": \"" API_VERSION "\"}", &lserror);
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }

  return retVal;
}

bool get_configs_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char buffer[MAXBUFLEN];
  char line[MAXLINLEN];
  char name[MAXNAMLEN];
  char command[MAXLINLEN];

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char *jsonResponse = 0;
  enum json_error jsonError = JSON_OK;

  json_t *response = json_new_object();

  FILE *fp = popen("/bin/ls -1 /media/cryptofs/apps/etc/ipkg/", "r");
  if (fp) {
    json_t *array = json_new_array();
    while ( fgets( name, sizeof name, fp)) {

      // Chomp the newline
      char *nl = strchr(name,'\n'); if (nl) *nl = 0;

      // Ignore the arch.conf file
      if (!strcmp(name, "arch.conf")) continue;

      // Create a JSON object for each config file
      json_t *object = json_new_object();

      // Determine if the config file is enabled or not
      char *p = strstr(name,".disabled");
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(object, "enabled", p ? json_new_false() : json_new_true());

      // Store the config name, excluding any .disabled suffix
      if (p) *p = '\0';
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(object, "config", json_new_string(name));
      if (p) *p = '.';

      strcpy(command, "/bin/cat /media/cryptofs/apps/etc/ipkg/");
      strcat(command, name);

      strcpy(buffer, "");
      bool append = false;

      FILE *cp = popen(command, "r");
      if (cp) {
	while ( fgets( line, sizeof line, cp)) {
	  if (append) {
	    strcat(buffer, "<br>");
	  }
	  char *eol = strchr(line,'\n');
	  if (eol) {
	    *eol = 0;
	  }
	  strcat(buffer, line);
	  append = true;
	}
      }
      if (!pclose(cp)) {
	json_insert_pair_into_object(object, "contents", json_new_string(buffer));
      }
      
      json_insert_child(array, object);
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
  }
  else {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Internal Error\"}", &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  return retVal;
}

bool update_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char buffer[MAXBUFLEN];
  char line[MAXLINLEN];
  char name[MAXNAMLEN];

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  retVal = LSMessageReply(lshandle, message, "{\"returnValue\": true, \"stage\": \"update\"}", &lserror);
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
    return retVal;
  }

  char *jsonResponse = 0;

  json_t *response = json_new_object();

  strcpy(buffer, "");

  FILE *fp = popen("/usr/bin/ipkg -o /media/cryptofs/apps update 2>&1", "r");
  if (fp) {
    json_t *array = json_new_array();
    while ( fgets( line, sizeof line, fp)) {

      // Chomp the newline
      char *nl = strchr(line,'\n'); if (nl) *nl = 0;

      json_t *object = json_new_object();
      json_insert_pair_into_object(object, "returnValue", json_new_true());
      json_insert_pair_into_object(object, "status", json_new_string(line));
      json_insert_pair_into_object(object, "stage", json_new_string("status"));
      json_tree_to_string(object, &jsonResponse);
      json_free_value(&object);
      retVal = LSMessageReply(lshandle, message, jsonResponse, &lserror);
      free(jsonResponse); jsonResponse = 0;
      if (!retVal) {
	LSErrorPrint(&lserror, stderr);
	LSErrorFree(&lserror);
	return retVal;
      }
    }
    if (!pclose(fp)) {
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(response, "returnValue", json_new_true());
      json_insert_pair_into_object(response, "stage", json_new_string("completed"));
      json_tree_to_string(response, &jsonResponse);
    }
  }

  if (jsonResponse) {
    retVal = LSMessageReply(lshandle, message, jsonResponse, &lserror);
    free(jsonResponse);
  }
  else {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Internal Error\"}", &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  return retVal;
}

bool run_command(LSHandle* lshandle, LSMessage *message, char *command) {
  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char buffer[MAXBUFLEN];
  strcpy(buffer, "{");
  bool first = true;

  FILE *fp = popen(command, "r");
  if (fp) {
    char line[MAXLINLEN];
    while (fgets(line, sizeof line, fp)) {
      if (first) {
	strcat(buffer, "\"errorText\": \"");
	first = false;
      }
      else {
	strcat(buffer, "<br>");
      }
      char *eol = strchr(line,'\n'); if (eol) *eol = 0;
      strcat(buffer, json_escape_str(line));
    }
    if (!first) strcat(buffer, "\", ");
    strcat(buffer, "\"returnValue\": ");
    if (!pclose(fp)) {
      strcat(buffer, "true, \"stage\": \"completed\"}");
    }
    else {
      strcat(buffer, "false, \"errorCode\": -1}");
    }
  }
  else {
    strcat(buffer, "\"errorText\": \"Unable to run command\", \"returnValue\": false, \"errorCode\": -1}");
  }

  retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }

  return retVal;
}

bool read_file(LSHandle* lshandle, LSMessage *message, FILE *file, bool subscribed) {
  char buffer[MAXBUFLEN];
  char sizestr[MAXNUMLEN];
  int chunksize = CHUNKSIZE;

  fseek(file, 0, SEEK_END);
  int filesize = ftell(file);
  fseek(file, 0, SEEK_SET);

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);
  char *jsonResponse = 0;
  
  if (subscribed) {
    retVal = false;
    if (asprintf(&jsonResponse, "{\"returnValue\": true, \"filesize\": %d, \"chunksize\": %d, \"stage\": \"start\"}", filesize, chunksize)) {
      retVal = LSMessageReply(lshandle, message, jsonResponse, &lserror);
    }
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
      return retVal;
    }
  }
  else {
    chunksize = filesize;
  }

  json_t *response = json_new_object();

  json_t *array = json_new_array();
  int size;
  int datasize = 0;
  while ((size = fread(buffer, 1, chunksize, file)) > 0) {
    datasize += size;
    buffer[size] = '\0';
    json_t *object = json_new_object();
    json_insert_pair_into_object(object, "returnValue", json_new_true());
    char *formatted = json_escape_str(buffer);
    sprintf(sizestr, "%d", strlen(formatted));
    json_insert_pair_into_object(object, "size", json_new_number(sizestr));
    json_insert_pair_into_object(object, "contents", json_new_string(formatted));
    if (subscribed) {
      json_insert_pair_into_object(object, "stage", json_new_string("middle"));
    }
    json_tree_to_string(object, &jsonResponse);
    json_free_value(&object);
    free(formatted);
    retVal = LSMessageReply(lshandle, message, jsonResponse, &lserror);
    free(jsonResponse); jsonResponse = 0;
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
      return retVal;
    }
  }

  if (!fclose(file)) {
    if (subscribed) {
      // %%% IGNORING RETURN ALERT %%%
      json_insert_pair_into_object(response, "returnValue", json_new_true());
      sprintf(sizestr, "%d", datasize);
      json_insert_pair_into_object(response, "datasize", json_new_number(sizestr));
      json_insert_pair_into_object(response, "stage", json_new_string("end"));
      json_tree_to_string(response, &jsonResponse);
      retVal = LSMessageReply(lshandle, message, jsonResponse, &lserror);
      free(jsonResponse); jsonResponse = 0;
    }
  }
  else {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Internal Error\"}", &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  return retVal;
}

bool get_list_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char command[MAXLINLEN];

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  // Extract the feed argument from the message
  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id = json_find_first_label(object, "feed");               
  if (!id || (id->child->type != JSON_STRING) || (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing feed\"}", &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }

  strcpy(command, "/media/cryptofs/apps/usr/lib/ipkg/lists/");
  strcat(command, id->child->text);

  FILE * listfile = fopen(command, "r");
  
  if (listfile == NULL) {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find feed\"}", &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }

  return read_file(lshandle, message, listfile, true);
}

bool get_control_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char command[MAXLINLEN];

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  // Extract the feed argument from the message
  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id = json_find_first_label(object, "package");               
  if (!id || (id->child->type != JSON_STRING) || (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing package\"}", &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }

  strcpy(command, "/media/cryptofs/apps/usr/lib/ipkg/info/");
  strcat(command, id->child->text);
  strcat(command, ".control");

  FILE * controlfile = fopen(command, "r");
  
  if (controlfile == NULL) {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find package\"}", &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }

  return read_file(lshandle, message, controlfile, false);
}

bool get_status_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  FILE * statusfile = fopen("/media/cryptofs/apps/usr/lib/ipkg/status", "r");
  
  if (statusfile == NULL) {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find status file\"}", &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }

  return read_file(lshandle, message, statusfile, false);
}

bool get_appinfo_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char command[MAXLINLEN];

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  // Extract the feed argument from the message
  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id = json_find_first_label(object, "package");               
  if (!id || (id->child->type != JSON_STRING) || (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing package\"}", &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }

  strcpy(command, "/media/cryptofs/apps/usr/palm/applications/");
  strcat(command, id->child->text);
  strcat(command, "/appinfo.json");

  FILE * appinfofile = fopen(command, "r");
  
  if (appinfofile == NULL) {
    retVal = LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find package\"}", &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }

  return read_file(lshandle, message, appinfofile, false);
}

bool set_config_state_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the config argument from the message
  id = json_find_first_label(object, "config");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing config parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char config[MAXNAMLEN];
  strcpy(config, id->child->text);

  // Extract the enabled argument from the message
  id = json_find_first_label(object, "enabled");
  if (!id || ((id->child->type != JSON_TRUE) && id->child->type != JSON_FALSE)) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing enabled parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  bool enabled = (id->child->type == JSON_TRUE);

  char command[MAXLINLEN];
  if (enabled) {
    snprintf(command, MAXLINLEN,
	     "mv /media/cryptofs/apps/etc/ipkg/%s.disabled /media/cryptofs/apps/etc/ipkg/%s 2>&1",
	     config, config);
  }
  else {
    snprintf(command, MAXLINLEN,
	     "mv /media/cryptofs/apps/etc/ipkg/%s /media/cryptofs/apps/etc/ipkg/%s.disabled 2>&1",
	     config, config);
  }

  return run_command(lshandle, message, command);
}

bool add_config_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the config argument from the message
  id = json_find_first_label(object, "config");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing config parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char config[MAXNAMLEN];
  strcpy(config, id->child->text);

  // Extract the name argument from the message
  id = json_find_first_label(object, "name");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing name parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char name[MAXNAMLEN];
  strcpy(name, id->child->text);

  // Extract the url argument from the message
  id = json_find_first_label(object, "url");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXLINLEN)) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing url parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char url[MAXLINLEN];
  strcpy(url, id->child->text);

  // Extract the gzip argument from the message
  id = json_find_first_label(object, "gzip");
  if (!id || ((id->child->type != JSON_TRUE) && id->child->type != JSON_FALSE)) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing gzip parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  bool gzip = (id->child->type == JSON_TRUE);

  char command[MAXLINLEN];
  snprintf(command, MAXLINLEN,
	   "echo \"%s %s %s\" > /media/cryptofs/apps/etc/ipkg/%s 2>&1",
	   gzip?"src/gz":"src", name, url, config);

  return run_command(lshandle, message, command);
}

bool delete_config_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the config argument from the message
  id = json_find_first_label(object, "config");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing config parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char config[MAXNAMLEN];
  strcpy(config, id->child->text);

  // Extract the name argument from the message
  id = json_find_first_label(object, "name");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing name parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char name[MAXNAMLEN];
  strcpy(name, id->child->text);

  char command[MAXLINLEN];
  snprintf(command, MAXLINLEN,
	   "/bin/rm /media/cryptofs/apps/etc/ipkg/%s 2>&1", config);

  return run_command(lshandle, message, command);
}

LSMethod luna_methods[] = {
  { "status",		dummy_method },
  { "version",		version_method },
  { "update",		update_method },
  { "getConfigs",	get_configs_method },
  { "getListFile",	get_list_file_method },
  { "getControlFile",	get_control_file_method },
  { "getStatusFile",	get_status_file_method },
  { "getAppinfoFile",	get_appinfo_file_method },
  { "setConfigState",	set_config_state_method },
  { "addConfig",	add_config_method },
  { "deleteConfig",	delete_config_method },
  { "install",		dummy_method },
  { "remove",		dummy_method },
  { "replace",		dummy_method },
  { "rescan",		dummy_method },
  { "restartLuna",	dummy_method },
  { "restartJava",	dummy_method },
  { "restartDevice",	dummy_method },
  { 0, 0 }
};

bool register_methods(LSPalmService *serviceHandle, LSError lserror) {
  return LSPalmServiceRegisterCategory(serviceHandle, "/", luna_methods,
				       NULL, NULL, NULL, &lserror);
}

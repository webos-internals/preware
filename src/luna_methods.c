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

#define ALLOWED_CHARS "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-+_"

#define API_VERSION "10"

static char buffer[MAXBUFLEN];
static char esc_buffer[MAXBUFLEN];
static char run_command_buffer[MAXBUFLEN];
static char read_file_buffer[MAXBUFLEN];

static char *json_escape_str(char *str)
{
  const char *json_hex_chars = "0123456789abcdef";

  char *resultsPt = (char *)esc_buffer;
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
  return (char *)esc_buffer;
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

typedef bool (*subscribefun)(char *);

static bool passthrough(char *message) {
  return true;
}

static bool downloadstats(char *message) {
  // 100  164k  100  164k    0     0  10055      0  0:00:16  0:00:16 --:--:-- 37284
  char total[MAXNUMLEN];
  char current[MAXNUMLEN];
  char togo[MAXNUMLEN];
  char speed[MAXNUMLEN];

  if ((sscanf(message, "%*s %s %*s %s %*s %*s %*s %*s %*s %*s %s %s",
	      &total, &current, &togo, &speed) == 4) &&
      strcmp(speed, "0") && strcmp(speed, "Current")) {
    sprintf(message, "Transferred: %s / %s<br>Time Left: %s<br>Transfer Speed: %s",
	    current, total, togo, speed);
    return true;
  }
  strcpy(message, "");
  return true;
}

static bool appinstaller(char *message) {
  if (strstr(message, "FAILED_IPKG_INSTALL")) {
    return false;
  }
  return true;
}

static bool run_command(char *command, LSHandle* lshandle, LSMessage *message, subscribefun subscriber) {
  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char line[MAXLINLEN];
  char lastline[MAXLINLEN];

  // run_command_buffer is assumed to be initialised, ready for strcat to append.

  bool first = true;

  FILE *fp = popen(command, "r");
  if (!fp) {
    return false;
  }

  strcpy(lastline, "");
  while (!feof(fp)) {
    int len = 0;
    char c;
    while ((len < MAXLINLEN) && ((c = fgetc(fp)) != EOF)) { 
      if ((c == '\r') || (c == '\n')) {
	if (!len) continue;
	break;
      }
      line[len++] = c; line[len] = '\0';
    }
    if (first) {
      first = false;
    }
    else {
      strcat(run_command_buffer, "<br>");
    }
    if (lshandle && message && subscriber) {
      if (strcmp(line, lastline)) {
	char newline[MAXLINLEN];
	strcpy(newline, line);
	if (!subscriber(newline)) {
	  break;
	}
	else if (strlen(newline)) {
	  strcpy(buffer, "{\"returnValue\": true, \"stage\": \"status\", \"status\": \"");
	  strcat(buffer, json_escape_str(newline));
	  strcat(buffer, "\"}");
	  retVal = LSMessageReply(lshandle, message, buffer, &lserror);
	  if (!retVal) {
	    LSErrorPrint(&lserror, stderr);
	    LSErrorFree(&lserror);
	    // Don't continue sending messages
	    strcpy(run_command_buffer, "");
	    return false;
	  }
	}
	strcpy(lastline, line);
      }
    }
    strcat(run_command_buffer, json_escape_str(line));
  }
  return !pclose(fp);
}

bool get_configs_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char line[MAXLINLEN];
  char name[MAXNAMLEN];
  char command[MAXLINLEN];

  bool retVal = true;
  LSError lserror;
  LSErrorInit(&lserror);

  bool first = true;

  FILE *fp = popen("/bin/ls -1 /media/cryptofs/apps/etc/ipkg/", "r");

  if (fp) {
    strcpy(buffer, "{");
    while ( fgets( name, sizeof name, fp)) {

      // Chomp the newline
      char *nl = strchr(name,'\n'); if (nl) *nl = 0;

      // Ignore the arch.conf file
      if (!strcmp(name, "arch.conf")) continue;

      if (first) {
	strcat(buffer, "\"configs\": [");
	first = false;
      }
      else {
	strcat(buffer, ", ");
      }

      strcat(buffer, "{");
	
      // Determine if the config file is enabled or not
      char *p = strstr(name,".disabled");
      if (p) {
	strcat(buffer, "\"enabled\": false, ");
      }
      else {
	strcat(buffer, "\"enabled\": true, ");
      }

      // Store the config name, excluding any .disabled suffix
      if (p) *p = '\0';
      strcat(buffer, "\"config\": \"");
      strcat(buffer, name);
      strcat(buffer, "\", ");
      if (p) *p = '.';

      strcpy(command, "/bin/cat /media/cryptofs/apps/etc/ipkg/");
      strcat(command, name);
      strcat(command, " 2>&1");

      strcpy(run_command_buffer, "");
      if (run_command(command, NULL, NULL, NULL)) {
	strcat(buffer, "\"contents\": \"");
      }
      else {
	strcat(buffer, "\"errorText\": \"");
	retVal = false;
      }
      strcat(buffer, run_command_buffer);
      strcat(buffer, "\"}");
    }
    if (!pclose(fp)) {
      if (!first) {
	strcat(buffer, "], ");
      }
      if (retVal) {
	strcat(buffer, "\"returnValue\": true}");
      }
      else {
	strcat(buffer, "\"returnValue\": false}");
      }
    }
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  else {
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command));
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  return retVal;
}

bool update_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  char command[MAXLINLEN];

  bool retVal = true;
  LSError lserror;
  LSErrorInit(&lserror);

  retVal = LSMessageReply(lshandle, message, "{\"returnValue\": true, \"stage\": \"update\"}", &lserror);
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
    return retVal;
  }

  strcpy(command, "/usr/bin/ipkg -o /media/cryptofs/apps update 2>&1");
  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, lshandle, message, passthrough)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  strcpy(command, "/bin/mkdir -p /media/cryptofs/apps/usr/lib/ipkg/cache 2>&1");
  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, lshandle, message, passthrough)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  strcpy(command, "/bin/rm -f /media/cryptofs/apps/usr/lib/ipkg/cache/* 2>&1");
  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, lshandle, message, passthrough)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  strcpy(command, "/bin/mv /media/cryptofs/apps/usr/lib/ipkg/lists/* /media/cryptofs/apps/usr/lib/ipkg/cache/ 2>&1");
  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, lshandle, message, passthrough)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
 
  return retVal;
}

static bool read_file(LSHandle* lshandle, LSMessage *message, FILE *file, bool subscribed) {
  char chunk[CHUNKSIZE];
  int chunksize = CHUNKSIZE;

  fseek(file, 0, SEEK_END);
  int filesize = ftell(file);
  fseek(file, 0, SEEK_SET);

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  if (subscribed) {
    retVal = false;
    if (sprintf(read_file_buffer,
		"{\"returnValue\": true, \"filesize\": %d, \"chunksize\": %d, \"stage\": \"start\"}",
		filesize, chunksize)) {
      retVal = LSMessageReply(lshandle, message, read_file_buffer, &lserror);
    }
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
      return false;
    }
  }
  else {
    chunksize = filesize;
  }

  int size;
  int datasize = 0;
  while ((size = fread(chunk, 1, chunksize, file)) > 0) {
    datasize += size;
    chunk[size] = '\0';
    sprintf(read_file_buffer, "{\"returnValue\": true, \"size\": %d, \"contents\": \"", size);
    strcat(read_file_buffer, json_escape_str(chunk));
    strcat(read_file_buffer, "\"");
    if (subscribed) {
      strcat(read_file_buffer, ", \"stage\": \"middle\"");
    }
    strcat(read_file_buffer, "}");
    retVal = LSMessageReply(lshandle, message, read_file_buffer, &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
      return false;
    }
  }

  if (!fclose(file)) {
    retVal = true;
    if (subscribed) {
      sprintf(read_file_buffer, "{\"returnValue\": true, \"datasize\": %d, \"stage\": \"end\"}", datasize);
      retVal = LSMessageReply(lshandle, message, read_file_buffer, &lserror);
    }
  }
  else {
    sprintf(read_file_buffer, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot close file\"}");
    retVal = LSMessageReply(lshandle, message, read_file_buffer, &lserror);
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

  strcpy(command, "/media/cryptofs/apps/usr/lib/ipkg/cache/");
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

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "\", \"returnValue\": true}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
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

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
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

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
}

bool rescan_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char command[MAXLINLEN];
  strcpy(command, "/usr/bin/luna-send -n 1 palm://com.palm.applicationManager/rescan {} 2>&1");

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "\", \"returnValue\": true}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
}

bool restart_luna_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char command[MAXLINLEN];
  strcpy(command, "/usr/bin/killall -HUP LunaSysMgr 2>&1");

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "\", \"returnValue\": true}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
}

bool restart_java_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char command[MAXLINLEN];
  strcpy(command, "/usr/bin/killall java 2>&1");

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
}

bool restart_device_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  char command[MAXLINLEN];
  strcpy(command, "/sbin/tellbootie 2>&1");

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "\", \"returnValue\": true}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
}

bool install_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the package argument from the message
  id = json_find_first_label(object, "package");
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing package parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char package[MAXNAMLEN];
  strcpy(package, id->child->text);

  // Extract the filename argument from the message
  id = json_find_first_label(object, "filename");
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing filename parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char filename[MAXNAMLEN];
  strcpy(filename, id->child->text);

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

  char command[MAXLINLEN];

  snprintf(command, MAXLINLEN,
	   "curl --create-dirs --insecure --location --fail --show-error --output /media/internal/.developer/%s %s 2>&1", filename, url);

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, lshandle, message, downloadstats)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"install\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1, \"stage\": \"failed\"}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
    return retVal;
  }

  snprintf(command, MAXLINLEN,
	   "luna-send -n 6 luna://com.palm.appinstaller/installNoVerify '{\"subscribe\":true, \"target\": \"/media/internal/.developer/%s\", \"uncompressedSize\": 0}' 2>&1", filename);

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, lshandle, message, appinstaller)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1, \"stage\": \"failed\"}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
}

bool remove_method(LSHandle* lshandle, LSMessage *message, void *ctx) {

  bool retVal;
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the package argument from the message
  id = json_find_first_label(object, "package");
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    retVal = LSMessageReply(lshandle, message,
			    "{\"returnValue\": false, \"errorCode\": -1, "
			    "\"errorText\": \"Invalid or missing package parameter\"}",
			    &lserror);
    if (!retVal) {
      LSErrorPrint(&lserror, stderr);
      LSErrorFree(&lserror);
    }
    return retVal;
  }
  char package[MAXNAMLEN];
  strcpy(package, id->child->text);

  char command[MAXLINLEN];

  snprintf(command, MAXLINLEN,
	   "luna-send -n 3 luna://com.palm.appinstaller/remove '{\"subscribe\":true, \"packageName\": \"%s\"}' 2>&1", package);

  strcpy(run_command_buffer, "{\"output\": \"");
  if (run_command(command, lshandle, message, appinstaller)) {
    strcat(run_command_buffer, "\", \"returnValue\": true, \"stage\": \"completed\"}");
    retVal = LSMessageReply(lshandle, message, run_command_buffer, &lserror);
  }
  else {
    strcat(run_command_buffer, "\"}");
    snprintf(buffer, MAXBUFLEN,
	     "\"errorText\": \"Unable to run command: %s<br>%s\", \"returnValue\": false, \"errorCode\": -1, \"stage\": \"failed\"}",
	     json_escape_str(command), run_command_buffer);
    retVal = LSMessageReply(lshandle, message, buffer, &lserror);
  }
  if (!retVal) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
  return retVal;
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
  { "rescan",		rescan_method },
  { "restartLuna",	restart_luna_method },
  { "restartJava",	restart_java_method },
  { "restartDevice",	restart_device_method },
  { "install",		install_method },
  { "remove",		remove_method },
  { "replace",		dummy_method },
  { 0, 0 }
};

bool register_methods(LSPalmService *serviceHandle, LSError lserror) {
  return LSPalmServiceRegisterCategory(serviceHandle, "/", luna_methods,
				       NULL, NULL, NULL, &lserror);
}

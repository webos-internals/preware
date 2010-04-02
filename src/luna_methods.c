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

#define API_VERSION "11"


//
// We use static buffers instead of continually allocating and deallocating stuff,
// since we're a long-running service, and do not want to leak anything.
//
static char buffer[MAXBUFLEN];
static char esc_buffer[MAXBUFLEN];
static char run_command_buffer[MAXBUFLEN];
static char read_file_buffer[CHUNKSIZE+CHUNKSIZE+1];

//
// Escape a string so that it can be used directly in a JSON response.
// In general, this means escaping quotes, backslashes and control chars.
// It uses the static esc_buffer, which must be twice as large as the
// largest string this routine can handle.
//
static char *json_escape_str(char *str)
{
  const char *json_hex_chars = "0123456789abcdef";

  // Initialise the output buffer
  strcpy(esc_buffer, "");

  // Check the constraints on the input string
  if (strlen(str) > MAXBUFLEN) return (char *)esc_buffer;

  // Initialise the pointers used to step through the input and output.
  char *resultsPt = (char *)esc_buffer;
  int pos = 0, start_offset = 0;

  // Traverse the input, copying to the output in the largest chunks
  // possible, escaping characters as we go.
  unsigned char c;
  do {
    c = str[pos];
    switch (c) {
    case '\0':
      // Terminate the copying
      break;
    case '\b':
    case '\n':
    case '\r':
    case '\t':
    case '"':
    case '\\': {
      // Copy the chunk before the character which must be escaped
      if (pos - start_offset > 0) {
	memcpy(resultsPt, str + start_offset, pos - start_offset);
	resultsPt += pos - start_offset;
      };
      
      // Escape the character
      if      (c == '\b') {memcpy(resultsPt, "\\b",  2); resultsPt += 2;} 
      else if (c == '\n') {memcpy(resultsPt, "\\n",  2); resultsPt += 2;} 
      else if (c == '\r') {memcpy(resultsPt, "\\r",  2); resultsPt += 2;} 
      else if (c == '\t') {memcpy(resultsPt, "\\t",  2); resultsPt += 2;} 
      else if (c == '"')  {memcpy(resultsPt, "\\\"", 2); resultsPt += 2;} 
      else if (c == '\\') {memcpy(resultsPt, "\\\\", 2); resultsPt += 2;} 

      // Reset the start of the next chunk
      start_offset = ++pos;
      break;
    }

    default:
      
      // Check for "special" characters
      if ((c < ' ') || (c > 127)) {

	// Copy the chunk before the character which must be escaped
	if (pos - start_offset > 0) {
	  memcpy(resultsPt, str + start_offset, pos - start_offset);
	  resultsPt += pos - start_offset;
	}

	// Insert a normalised representation
	sprintf(resultsPt, "\\u00%c%c",
		json_hex_chars[c >> 4],
		json_hex_chars[c & 0xf]);

	// Reset the start of the next chunk
	start_offset = ++pos;
      }
      else {
	// Just move along the source string, without copying
	pos++;
      }
    }
  } while (c);

  // Copy the final chunk, if required
  if (pos - start_offset > 0) {
    memcpy(resultsPt, str + start_offset, pos - start_offset);
    resultsPt += pos - start_offset;
  } 

  // Terminate the output buffer ...
  memcpy(resultsPt, "\0", 1);

  // and return a pointer to it.
  return (char *)esc_buffer;
}

//
// A dummy method, useful for unimplemented functions or as a status function.
// Called directly from webOS, and returns directly to webOS.
//
bool dummy_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  if (!LSMessageReply(lshandle, message, "{\"returnValue\": true}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

//
// Return the current API version of the service.
// Called directly from webOS, and returns directly to webOS.
//
bool version_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  if (!LSMessageReply(lshandle, message, "{\"returnValue\": true, \"apiVersion\": \"" API_VERSION "\"}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

//
// Restart ipkgservice.
//
bool restart_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);
  (void)LSMessageReply(lshandle, message, "{\"returnValue\": true}", &lserror);
  (void)system("/usr/bin/killall org.webosinternals.ipkgservice");
  // It's likely that this point will never be reached.
  return true;
}

//
// A function pointer, used to filter output messages from commands.
// The input string is assumed to be a buffer large enough to hold
// the filtered output string, and is forcibly overwritten.
// The return value says whether this message should be considered
// to be an immediate terminating error condition from the command.
//
typedef bool (*subscribefun)(char *);

//
// Pass through all messages unchanged.
//
static bool passthrough(char *message) {
  return true;
}

//
// Parse progress messages from curl --verbose and format for display in webOS.
// curl provides a correct command return status value, so we always return true.
// Messages are of the form:
// 100  164k  100  164k    0     0  10055      0  0:00:16  0:00:16 --:--:-- 37284
//
static bool downloadstats(char *message) {

  // Buffers to store the extracted data
  char total[MAXNUMLEN];
  char current[MAXNUMLEN];
  char togo[MAXNUMLEN];
  char speed[MAXNUMLEN];

  // Check for curl progress messages, and extract the relevant data
  if ((sscanf(message, "%*s %s %*s %s %*s %*s %*s %*s %*s %*s %s %s",
	      &total, &current, &togo, &speed) == 4) &&
      // Ignore the first line and initial fetch latency
      strcmp(speed, "0") && strcmp(speed, "Current")) {
    // Format in a short human-readable format.
    sprintf(message, "Transferred: %s / %s<br>Time Left: %s<br>Transfer Speed: %s",
	    current, total, togo, speed);
    return true;
  }

  // Nullify any other messages
  strcpy(message, "");
  return true;
}

//
// Parse progress messages from the com.palm.appinstaller service and format for display in webOS.
// We also need to force a termination on install failures (since luna-send will hang early).
// Messages are of the form:
// ** Message: serviceResponse Handling: 2, { \"ticket\":28 , \"status\":\"VERIFYING\" }
//
static bool appinstaller(char *message) {

  // A buffer to store the extracted data
  char status[MAXLINLEN];

  // Check for appinstaller progress messages, and extract the relevant data
  if ((sscanf(message, "%*s %*s %*s %*s %*s { %*s , \"status\":\"%s }",
	      &status) == 1)) {

    // The last string field will still have the ending ", so remove that.
    status[strlen(status)-1] = '\0';

    // %%% We may want to do a mapping to more end-user friendly messages here. %%%

    // Format in a short human-readable format.
    sprintf(message, "%s", status);

    // Terminate the command early if there is an install failure.
    if (!strcmp(status, "FAILED_IPKG_INSTALL")) {
      return false;
    }

    return true;
  }

  // Nullify any other messages
  strcpy(message, "");
  return true;
}

//
// Run a shell command, and return the output in-line in a buffer for returning to webOS.
// If lshandle, message and subscriber are defined, then also send back status messages.
// The global run_command_buffer must be initialised before calling this function.
// The return value says whether the command executed successfully or not.
//
static bool run_command(char *command, LSHandle* lshandle, LSMessage *message, subscribefun subscriber) {
  LSError lserror;
  LSErrorInit(&lserror);

  // Local buffers to store the current and previous lines.
  char line[MAXLINLEN];
  char lastline[MAXLINLEN];

  fprintf(stderr, "Running command %s\n", command);

  // run_command_buffer is assumed to be initialised, ready for strcat to append.

  // Is this the first line of output?
  bool first = true;

  // Has an early termination error been detected?
  bool error = false;

  bool array = false;

  // Start execution of the command, and read the output.
  FILE *fp = popen(command, "r");

  // Return immediately if we cannot even start the command.
  if (!fp) {
    return false;
  }

  // Initialise the previous line contents.
  strcpy(lastline, "");

  // Loop through the output lines
  while (!feof(fp)) {

    // Initialise the current line contents.
    strcpy(line, "");
    int len = 0;

    // Read and store characters up to the next LF or NL.
    int c;
    while ((len < MAXLINLEN) && ((c = fgetc(fp)) != EOF)) { 
      if ((c == '\r') || (c == '\n')) {
	line[len] = '\0';
	// Skip empty lines
	if (!len) continue;
	break;
      }
      line[len++] = c; line[len] = '\0';
    }

    // If we read something, then process it
    if (len) {

      // Add formatting breaks between lines
      if (first) {
	if (run_command_buffer[strlen(run_command_buffer)-1] == '[') {
	  array = true;
	}
	first = false;
      }
      else {
	if (array) {
	  strcat(run_command_buffer, ", ");
	}
	else {
	  strcat(run_command_buffer, "<br>");
	}
      }

      // Have status updates been requested?
      if (lshandle && message && subscriber) {

	// Is the current line different from the last line?
	if (strcmp(line, lastline)) {

	  // Copy into a new local buffer for possible modification
	  // cause we want the original to be return in run_command_buffer.
	  char newline[MAXLINLEN];
	  strcpy(newline, line);

	  // Perform the filtering modificatons, and check for termination errors.
	  if (!subscriber(newline)) error = true;

	  // Is there anything left after filtering?
	  if (strlen(newline)) {

	    // Send it as a status message.
	    strcpy(buffer, "{\"returnValue\": true, \"stage\": \"status\", \"status\": \"");
	    strcat(buffer, json_escape_str(newline));
	    strcat(buffer, "\"}");

	    // %%% Should we break out of the loop here, or just ignore the error? %%%
	    if (!LSMessageReply(lshandle, message, buffer, &lserror)) goto error;

	  }

	  // If a termination failure has been detected, then break out of the loop.
	  if (error) break;

	  // Store the current line as the previous line to check next time around.
	  strcpy(lastline, line);
	}
      }

      // Append the unfiltered output to the run_command_buffer.
      if (array) {
	strcat(run_command_buffer, "\"");
      }
      strcat(run_command_buffer, json_escape_str(line));
      if (array) {
	strcat(run_command_buffer, "\"");
      }
    }
  }

  // Check the close status of the process, and return the combined error status
  if (pclose(fp) || error) {
    return false;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  // %%% We need a way to distinguish command failures from LSMessage failures %%%
  // %%% This may need to be true if we just want to ignore LSMessage failures %%%
  return false;
}

//
// Send a standard format command failure message back to webOS.
// The command will be escaped.  The output argument should be a JSON array and is not escaped.
// The additional text  will not be escaped.
// The return value is from the LSMessageReply call, not related to the command execution.
//
static bool report_command_failure(LSHandle* lshandle, LSMessage *message, char *command, char *stdErrText, char *additional) {
  LSError lserror;
  LSErrorInit(&lserror);

  // Include the command that was executed, in escaped form.
  snprintf(buffer, MAXBUFLEN,
	   "{\"errorText\": \"Unable to run command: %s\"",
	   json_escape_str(command));

  // Include any stderr fields from the command.
  if (stdErrText) {
    strcat(buffer, ", \"stdErr\": ");
    strcat(buffer, stdErrText);
  }

  // Report that an error occurred.
  strcat(buffer, ", \"returnValue\": false, \"errorCode\": -1");

  // Add any additional JSON fields.
  if (additional) {
    strcat(buffer, ", ");
    strcat(buffer, additional);
  }

  // Terminate the JSON reply message ...
  strcat(buffer, "}");

  // and send it.
  if (!LSMessageReply(lshandle, message, buffer, &lserror)) goto error;

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

//
// Run a simple shell command, and return the output to webOS.
//
static bool simple_command(LSHandle* lshandle, LSMessage *message, char *command) {
  LSError lserror;
  LSErrorInit(&lserror);

  // Initialise the output buffer
  strcpy(run_command_buffer, "{\"stdOut\": [");

  // Run the command
  if (run_command(command, NULL, NULL, NULL)) {

    // Finalise the message ...
    strcat(run_command_buffer, "], \"returnValue\": true}");

    // and send it to webOS.
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {

    // Finalise the command output ...
    strcat(run_command_buffer, "]");

    // and use it in a failure report message.
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, NULL)) goto end;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

//
// Call the rescan service, and return the output to webOS.
//
bool rescan_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  return simple_command(lshandle, message, "/usr/bin/luna-send -n 1 palm://com.palm.applicationManager/rescan {} 2>&1");
}

//
// Restart Luna, and return the output to webOS.
//
bool restart_luna_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  return simple_command(lshandle, message, "/usr/bin/killall -HUP LunaSysMgr 2>&1");
}

//
// Restart Java, and return the output to webOS.
//
bool restart_java_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  return simple_command(lshandle, message, "/usr/bin/killall java 2>&1");
}

//
// Restart the device, and return the output to webOS.
//
bool restart_device_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  return simple_command(lshandle, message, "/sbin/tellbootie 2>&1");
}

//
// Get the list of ipkg configuration files, and return them and their contents.
//
bool get_configs_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  // Local buffer to store the config filename
  char filename[MAXNAMLEN];

  // Local buffer to build a command to read the config file contents
  char command[MAXLINLEN];

  // Is this the first line of output?
  bool first = true;

  // Was there an error in accessing any of the files?
  bool error = false;

  // Initialise the command to read the list of config files.
  strcpy(command, "/bin/ls -1 /media/cryptofs/apps/etc/ipkg/ 2>&1");

  // Start execution of the command to list the config files.
  FILE *fp = popen(command, "r");

  // If the command cannot be started
  if (!fp) {

    // then report the error to webOS.
    if (!report_command_failure(lshandle, message, command, NULL, NULL)) goto end;

    // The error report has been sent, so return to webOS.
    return true;
  }

  // Initialise the output message.
  strcpy(buffer, "{");

  // Loop through the list of files in the config directory.
  while ( fgets( filename, sizeof filename, fp)) {

    // Chomp the newline
    char *nl = strchr(filename,'\n'); if (nl) *nl = 0;

    // Ignore the arch.conf file
    if (!strcmp(filename, "arch.conf")) continue;

    // Start or continue the JSON array
    if (first) {
      strcat(buffer, "\"configs\": [");
      first = false;
    }
    else {
      strcat(buffer, ", ");
    }

    // Start the entry for each config file
    strcat(buffer, "{");
	
    // Determine if the config file is enabled or not
    char *p = strstr(filename,".disabled");

    // Store the config name, excluding any .disabled suffix
    if (p) *p = '\0';
    strcat(buffer, "\"config\": \"");
    strcat(buffer, filename);
    strcat(buffer, "\", ");
    if (p) *p = '.';

    // Store the enabled flag
    strcat(buffer, "\"enabled\": ");
    strcat(buffer, p ? "false" : "true");
    strcat(buffer, ", ");

    // Initialise the command to read the contents of the file.
    strcpy(command, "/bin/cat /media/cryptofs/apps/etc/ipkg/");
    strcat(command, filename);
    strcat(command, " 2>&1");

    // Initialise the output buffer.
    strcpy(run_command_buffer, "");

    // Retrieve the file contents, and check for an error
    if (run_command(command, NULL, NULL, NULL)) {
      strcat(buffer, "\"contents\": \"");
    }
    else {
      strcat(buffer, "\"errorText\": \"");
      error = true;
    }

    // Store the command output (the contents of the file)
    strcat(buffer, run_command_buffer);

    // Terminate the JSON entry
    strcat(buffer, "\"}");
  }

  // Terminate the JSON array
  if (!first) {
    strcat(buffer, "], ");
  }

  // Check the close status of the process, and return the combined error status
  if (pclose(fp) || error) {
    strcat(buffer, "\"returnValue\": false}");
  }
  else {
    strcat(buffer, "\"returnValue\": true}");
  }

  // Return the results to webOS.
  if (!LSMessageReply(lshandle, message, buffer, &lserror)) goto error;

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

//
// Run ipkg update to download all enabled feeds.
// Note that the package lists are retrieved separately, this just does the download.
// The package lists are moved to a cache sibling directory to avoid any possible
// interaction with installations via the App Catalog and ApplicationInstallerUtility.
//
bool update_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  // Local buffer to store the update command
  char command[MAXLINLEN];

  // Capture any errors
  bool error = false;

  // Report that the update operaton has begun
  if (!LSMessageReply(lshandle, message, "{\"returnValue\": true, \"stage\": \"update\"}", &lserror)) goto error;

  // Store the command, so it can be used in the error report if necessary
  strcpy(command, "/usr/bin/ipkg -o /media/cryptofs/apps update 2>&1");

  // Initialise the output buffer
  strcpy(run_command_buffer, "{\"stdOut\": [");

  // Run the update command
  if (!run_command(command, lshandle, message, passthrough)) {

    // Terminate the output buffer
    strcat(run_command_buffer, "]");

    // Report the command failure.
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, NULL)) goto end;

    // Remember that an error occurred, to be reported at the end
    error = true;

    // Even if there is an error, continue to move the files below
  }
 
  // Create the cache directory
  strcpy(command, "/bin/mkdir -p /media/cryptofs/apps/usr/lib/ipkg/cache 2>&1");
  strcpy(run_command_buffer, "[");
  if (!run_command(command, lshandle, message, passthrough)) {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer, NULL)) goto end;
    error = true;
    // Even if there is an error, continue to move the files below
  }
 
  // Remove any existing cache files
  strcpy(command, "/bin/rm -f /media/cryptofs/apps/usr/lib/ipkg/cache/* 2>&1");
  strcpy(run_command_buffer, "[");
  if (!run_command(command, lshandle, message, passthrough)) {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer, NULL)) goto end;
    error = true;
    // Even if there is an error, continue to move the files below
  }
 
  // Move package feed lists files over to the cache
  strcpy(command, "/bin/mv /media/cryptofs/apps/usr/lib/ipkg/lists/* /media/cryptofs/apps/usr/lib/ipkg/cache/ 2>&1");
  strcpy(run_command_buffer, "[");
  if (!run_command(command, lshandle, message, passthrough)) {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer, NULL)) goto end;
    error = true;
    // At this point, we're done anyway
  }
 
  // Report the error status of the initial update command
  if (error) {
    if (!LSMessageReply(lshandle, message, "{\"returnValue\": false, \"stage\": \"failed\"}", &lserror)) goto error;
  }
  else {
    if (!LSMessageReply(lshandle, message, "{\"returnValue\": true, \"stage\": \"completed\"}", &lserror)) goto error;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

static bool read_file(LSHandle* lshandle, LSMessage *message, FILE *file, bool subscribed) {
  LSError lserror;
  LSErrorInit(&lserror);

  char chunk[CHUNKSIZE];
  int chunksize = CHUNKSIZE;

  fseek(file, 0, SEEK_END);
  int filesize = ftell(file);
  fseek(file, 0, SEEK_SET);

  if (subscribed) {
    if (sprintf(read_file_buffer,
		"{\"returnValue\": true, \"filesize\": %d, \"chunksize\": %d, \"stage\": \"start\"}",
		filesize, chunksize)) {

      if (!LSMessageReply(lshandle, message, read_file_buffer, &lserror)) goto error;

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

    if (!LSMessageReply(lshandle, message, read_file_buffer, &lserror)) goto error;

  }

  if (!fclose(file)) {
    if (subscribed) {
      sprintf(read_file_buffer, "{\"returnValue\": true, \"datasize\": %d, \"stage\": \"end\"}", datasize);

      if (!LSMessageReply(lshandle, message, read_file_buffer, &lserror)) goto error;

    }
  }
  else {
    sprintf(read_file_buffer, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot close file\"}");

    if (!LSMessageReply(lshandle, message, read_file_buffer, &lserror)) goto error;

  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool get_list_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  char command[MAXLINLEN];

  // Extract the feed argument from the message
  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id = json_find_first_label(object, "feed");               
  if (!id || (id->child->type != JSON_STRING) || (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing feed\"}",
			&lserror)) goto error;
    return true;
  }

  strcpy(command, "/media/cryptofs/apps/usr/lib/ipkg/cache/");
  strcat(command, id->child->text);

  FILE * listfile = fopen(command, "r");
  
  if (listfile) {
    return read_file(lshandle, message, listfile, true);
  }
  else {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find feed\"}",
			&lserror)) goto error;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool get_control_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  char command[MAXLINLEN];

  // Extract the feed argument from the message
  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id = json_find_first_label(object, "package");               
  if (!id || (id->child->type != JSON_STRING) || (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing package\"}",
			&lserror)) goto error;
  }

  strcpy(command, "/media/cryptofs/apps/usr/lib/ipkg/info/");
  strcat(command, id->child->text);
  strcat(command, ".control");

  FILE * controlfile = fopen(command, "r");
  
  if (controlfile) {
    return read_file(lshandle, message, controlfile, false);
  }
  else {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find package\"}",
			&lserror)) goto error;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool get_status_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  FILE * statusfile = fopen("/media/cryptofs/apps/usr/lib/ipkg/status", "r");
  
  if (statusfile) {
    return read_file(lshandle, message, statusfile, true);
  }
  else {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find status file\"}",
			&lserror)) goto error;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool get_appinfo_file_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  char command[MAXLINLEN];

  // Extract the feed argument from the message
  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id = json_find_first_label(object, "package");               
  if (!id || (id->child->type != JSON_STRING) || (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing package\"}",
			&lserror)) goto error;
    return true;
  }

  strcpy(command, "/media/cryptofs/apps/usr/palm/applications/");
  strcat(command, id->child->text);
  strcat(command, "/appinfo.json");

  FILE * appinfofile = fopen(command, "r");
  
  if (appinfofile) {
    return read_file(lshandle, message, appinfofile, false);
  }
  else {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Cannot find package\"}",
			&lserror)) goto error;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool set_config_state_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the config argument from the message
  id = json_find_first_label(object, "config");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing config parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char config[MAXNAMLEN];
  strcpy(config, id->child->text);

  // Extract the enabled argument from the message
  id = json_find_first_label(object, "enabled");
  if (!id || ((id->child->type != JSON_TRUE) && id->child->type != JSON_FALSE)) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing enabled parameter\"}",
			&lserror)) goto error;
    return true;
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

  strcpy(run_command_buffer, "{\"stdOut\": [");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "], \"returnValue\": true}");
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, NULL)) goto end;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool add_config_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the config argument from the message
  id = json_find_first_label(object, "config");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing config parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char config[MAXNAMLEN];
  strcpy(config, id->child->text);

  // Extract the name argument from the message
  id = json_find_first_label(object, "name");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing name parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char name[MAXNAMLEN];
  strcpy(name, id->child->text);

  // Extract the url argument from the message
  id = json_find_first_label(object, "url");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXLINLEN)) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing url parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char url[MAXLINLEN];
  strcpy(url, id->child->text);

  // Extract the gzip argument from the message
  id = json_find_first_label(object, "gzip");
  if (!id || ((id->child->type != JSON_TRUE) && id->child->type != JSON_FALSE)) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing gzip parameter\"}",
			&lserror)) goto error;
    return true;
  }
  bool gzip = (id->child->type == JSON_TRUE);

  char command[MAXLINLEN];
  snprintf(command, MAXLINLEN,
	   "echo \"%s %s %s\" > /media/cryptofs/apps/etc/ipkg/%s 2>&1",
	   gzip?"src/gz":"src", name, url, config);

  strcpy(run_command_buffer, "{\"stdOut\": [");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"completed\"}");
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, NULL)) goto end;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool delete_config_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  // Extract the config argument from the message
  id = json_find_first_label(object, "config");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing config parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char config[MAXNAMLEN];
  strcpy(config, id->child->text);

  // Extract the name argument from the message
  id = json_find_first_label(object, "name");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing name parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char name[MAXNAMLEN];
  strcpy(name, id->child->text);

  char command[MAXLINLEN];
  snprintf(command, MAXLINLEN,
	   "/bin/rm /media/cryptofs/apps/etc/ipkg/%s 2>&1", config);

  strcpy(run_command_buffer, "{\"stdOut\": [");
  if (run_command(command, NULL, NULL, NULL)) {
    strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"completed\"}");
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, NULL)) goto end;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool do_install(LSHandle* lshandle, LSMessage *message, char *installCommand, subscribefun installFilter, bool *installed) {
  LSError lserror;
  LSErrorInit(&lserror);

  struct stat info;

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  *installed = false;

  // Extract the package argument from the message
  id = json_find_first_label(object, "package");
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing package parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char package[MAXNAMLEN];
  strcpy(package, id->child->text);

  // Extract the filename argument from the message
  id = json_find_first_label(object, "filename");
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing filename parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char filename[MAXNAMLEN];
  strcpy(filename, id->child->text);

  // Extract the url argument from the message
  id = json_find_first_label(object, "url");               
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXLINLEN)) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing url parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char url[MAXLINLEN];
  strcpy(url, id->child->text);

  char command[MAXLINLEN];

  snprintf(command, MAXLINLEN,
	   "/usr/bin/curl --create-dirs --insecure --location --fail --show-error --output /media/internal/.developer/%s %s 2>&1", filename, url);

  strcpy(run_command_buffer, "{\"stdOut\": [");
  if (run_command(command, lshandle, message, downloadstats)) {
    strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"download\"}");
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, NULL)) goto end;
    return true;
  }

  snprintf(command, MAXLINLEN, installCommand, filename);

  strcpy(run_command_buffer, "{\"stdOut\": [");
  if (run_command(command, lshandle, message, installFilter)) {
    strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"install\"}");
    *installed = true;
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {
    strcat(run_command_buffer, "]");
    *installed = false;
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"failed\"")) goto end;
    return true;
  }

  // Check for an ipkg prerm script, and install it
  char prerm[MAXLINLEN];
  sprintf(prerm, "/media/cryptofs/apps/usr/lib/ipkg/info/%s.prerm", package);

  if (!stat(prerm, &info)) {

    snprintf(command, MAXLINLEN,
	     "/bin/mkdir -p /media/cryptofs/apps/.scripts/%s 2>&1", package);
      
    strcpy(run_command_buffer, "{\"stdOut\": [");
    if (run_command(command, lshandle, message, passthrough)) {
      strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"mkdir-prerm\"}");
      if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
    }
    else {
      strcat(run_command_buffer, "]");
      if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"mkdir-prerm\"")) goto end;
      // Ignore any error here.
    }

    snprintf(command, MAXLINLEN,
	     "/usr/bin/install -m 755 %s /media/cryptofs/apps/.scripts/%s/pmPreRemove.script 2>&1", prerm, package);
      
    strcpy(run_command_buffer, "{\"stdOut\": [");
    if (run_command(command, lshandle, message, passthrough)) {
      strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"install-prerm\"}");
      if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
    }
    else {
      strcat(run_command_buffer, "]");
      if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"install-prerm\"")) goto end;
      // Ignore any error here.
    }
  }
 
  // Check for an ipkg postinst script, and run it
  char postinst[MAXLINLEN];
  sprintf(postinst, "/media/cryptofs/apps/usr/lib/ipkg/info/%s.postinst", package);

  if (!stat(postinst, &info)) {

    (void)system("/bin/mount -o remount,rw /");

    snprintf(command, MAXLINLEN,
	     "IPKG_OFFLINE_ROOT=/media/cryptofs/apps /bin/sh %s 2>&1", postinst);
      
    strcpy(run_command_buffer, "{\"stdOut\": [");
    if (run_command(command, lshandle, message, passthrough)) {
      strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"postinst\"}");
      *installed = true;
      if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
    }
    else {
      strcat(run_command_buffer, "]");
      *installed = false;
      if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"postinst\"")) goto end;
      // Ignore any error here.
    }
  }

  if (*installed) {
    if (!LSMessageReply(lshandle, message, "{\"returnValue\": true, \"stage\": \"completed\"}", &lserror)) goto error;
  }
  else {
    snprintf(command, MAXLINLEN,
	     "/usr/bin/ipkg -o /media/cryptofs/apps remove %s 2>&1", package);
    
    strcpy(run_command_buffer, "{\"stdOut\": [");
    if (run_command(command, lshandle, message, appinstaller)) {
      strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"remove\"}");
      if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
    }
    else {
      strcat(run_command_buffer, "]");
      if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"remove\"")) goto end;
    }

    snprintf(command, MAXLINLEN,
	     "/bin/rm -rf /media/cryptofs/apps/usr/palm/applications/%s /media/cryptofs/apps/.scripts/%s 2>&1", package, package);
    
    strcpy(run_command_buffer, "{\"stdOut\": [");
    if (run_command(command, lshandle, message, appinstaller)) {
      strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"delete\"}");
      if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
    }
    else {
      strcat(run_command_buffer, "]");
      if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"delete\"")) goto end;
    }

    if (!LSMessageReply(lshandle, message, "{\"returnValue\": false, \"stage\": \"failed\"}", &lserror)) goto error;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool do_remove(LSHandle* lshandle, LSMessage *message, bool *removed) {
  LSError lserror;
  LSErrorInit(&lserror);

  json_t *object = LSMessageGetPayloadJSON(message);
  json_t *id;

  *removed = false;

  // Extract the package argument from the message
  id = json_find_first_label(object, "package");
  if (!id || (id->child->type != JSON_STRING) ||
      (strlen(id->child->text) >= MAXNAMLEN) ||
      (strspn(id->child->text, ALLOWED_CHARS) != strlen(id->child->text))) {
    if (!LSMessageReply(lshandle, message,
			"{\"returnValue\": false, \"errorCode\": -1, "
			"\"errorText\": \"Invalid or missing package parameter\"}",
			&lserror)) goto error;
    return true;
  }
  char package[MAXNAMLEN];
  strcpy(package, id->child->text);

  char command[MAXLINLEN];

  struct stat info;

  // Check for an ipkg prerm script
  char prerm[MAXLINLEN];
  sprintf(prerm, "/media/cryptofs/apps/usr/lib/ipkg/info/%s.prerm", package);

  if (!stat(prerm, &info)) {

    (void)system("/bin/mount -o remount,rw /");

    snprintf(command, MAXLINLEN,
	     "IPKG_OFFLINE_ROOT=/media/cryptofs/apps /bin/sh %s 2>&1", prerm);
      
    strcpy(run_command_buffer, "{\"stdOut\": [");
    if (run_command(command, lshandle, message, passthrough)) {
      strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"prerm\"}");
      if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
    }
    else {
      strcat(run_command_buffer, "]");
      *removed = false;
      if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"failed\"")) goto end;
      return true;
    }

  }

  char appinfo[MAXLINLEN];
  sprintf(appinfo, "/media/cryptofs/apps/usr/palm/applications/%s/appinfo.json", package);

  if (!stat(appinfo, &info)) {
    snprintf(command, MAXLINLEN,
	     "/usr/bin/luna-send -n 3 luna://com.palm.appinstaller/remove '{\"subscribe\":true, \"packageName\": \"%s\"}' 2>&1", package);
  }
  else {
    snprintf(command, MAXLINLEN,
	     "/usr/bin/ipkg -o /media/cryptofs/apps remove %s 2>&1", package);
  }


  strcpy(run_command_buffer, "{\"stdOut\": [");
  if (run_command(command, lshandle, message, appinstaller)) {
    strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"remove\"}");
    *removed = true;
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {
    strcat(run_command_buffer, "]");
    *removed = false;
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"failed\"")) goto end;
    // %%% Should check for whether the application directory has been removed, or run ipkg list_installed %%%
    // Assume that it hasn't been removed properly (don't change *removed)
    return true;
  }
  
  snprintf(command, MAXLINLEN,
	   "/bin/rm -rf /media/cryptofs/apps/usr/palm/applications/%s /media/cryptofs/apps/.scripts/%s 2>&1", package, package);
    
  strcpy(run_command_buffer, "{\"stdOut\": [");
  if (run_command(command, lshandle, message, appinstaller)) {
    strcat(run_command_buffer, "], \"returnValue\": true, \"stage\": \"delete\"}");
    if (!LSMessageReply(lshandle, message, run_command_buffer, &lserror)) goto error;
  }
  else {
    strcat(run_command_buffer, "]");
    if (!report_command_failure(lshandle, message, command, run_command_buffer+11, "\"stage\": \"delete\"")) goto end;
  }

  if (!LSMessageReply(lshandle, message, "{\"returnValue\": true, \"stage\": \"completed\"}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

bool appinstaller_install_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  bool installed;
  return do_install(lshandle, message,
		    "/usr/bin/luna-send -n 6 luna://com.palm.appinstaller/installNoVerify '{\"subscribe\":true, \"target\": \"/media/internal/.developer/%s\", \"uncompressedSize\": 0}' 2>&1",
		    appinstaller, &installed);
}

bool ipkg_install_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  bool installed;
  return do_install(lshandle, message,
		    "/usr/bin/ipkg -o /media/cryptofs/apps -force-overwrite install /media/internal/.developer/%s 2>&1",
		    passthrough, &installed);
}

bool remove_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  bool removed;
  return do_remove(lshandle, message, &removed);
}

bool replace_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit(&lserror);

  bool removed = false;
  if (!do_remove(lshandle, message, &removed)) goto end;
  if (removed) {
    if (!ipkg_install_method(lshandle, message, ctx)) goto end;
  }

  return true;
 error:
  LSErrorPrint(&lserror, stderr);
  LSErrorFree(&lserror);
 end:
  return false;
}

LSMethod luna_methods[] = {
  { "status",		dummy_method },
  { "version",		version_method },
  { "restart",		restart_method },

  { "update",		update_method },

  { "rescan",		rescan_method },
  { "restartLuna",	restart_luna_method },
  { "restartJava",	restart_java_method },
  { "restartDevice",	restart_device_method },

  { "getConfigs",	get_configs_method },
  { "getListFile",	get_list_file_method },
  { "getControlFile",	get_control_file_method },
  { "getStatusFile",	get_status_file_method },
  { "getAppinfoFile",	get_appinfo_file_method },

  { "setConfigState",	set_config_state_method },
  { "addConfig",	add_config_method },
  { "deleteConfig",	delete_config_method },

//{ "install",		appinstaller_install_method },
  { "install",		ipkg_install_method },

  { "replace",		replace_method },
  { "remove",		remove_method },

  { 0, 0 }
};

bool register_methods(LSPalmService *serviceHandle, LSError lserror) {
  return LSPalmServiceRegisterCategory(serviceHandle, "/", luna_methods,
				       NULL, NULL, NULL, &lserror);
}

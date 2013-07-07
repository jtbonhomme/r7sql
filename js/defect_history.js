/*
 * Description :
 * This program reads data in mySql dump of a redmine database and analyzis 
 * defects to extracts statistics :
 * - number of open and closed defects per severity (custom field)
 * - average time needed to fix an issue (one value per severity)
 * - histogram with these previous data, day by day (todo: use dataviz js lib)
 * Installation :
 * Import in your local mysql server a Redmine mysql dump.
 * Then run
 *     node js/defect_history.js
 */

// node dependencies (see package.json for 'mysql' version)
var sys = require("sys");
var mysql = require('mysql');

// local dependencies
var Redmine = require('./redmine');
var Time = require('./time');
var Db = require('./db');

var db = new Db();
var redmine = new Redmine();
var time = new Time();

/*
 * global variables
 *
 * history = {
 *   "20130401": {
 *     "created": ...
 *     "closed": ...
 *   },
 *   ...
 }
 * };
 */
var history = {
  "allDates": []
}; 
var defects = [];
var averageFixDelay = 0;
var stats = {
  "total": 0,
  "Blocker": {
    "closed": 0,
    "opened": 0,
    "averageTimeToFix": 0
  },
  "Critical": {
    "closed": 0,
    "opened": 0,
    "averageTimeToFix": 0
  },
  "Major": {
    "closed": 0,
    "opened": 0,
    "averageTimeToFix": 0
  },
  "Normal": {
    "closed": 0,
    "opened": 0,
    "averageTimeToFix": 0
  },
  "Minor": {
    "closed": 0,
    "opened": 0,
    "averageTimeToFix": 0
  },
  "Trivial": {
    "closed": 0,
    "opened": 0,
    "averageTimeToFix": 0
  }
};

// todo: use colors.js : https://github.com/marak/colors.js/
var green   = '\u001b[32m';
var red     = '\u001b[31m';
var blue    = '\u001b[34m';
var reset   = '\u001b[0m';

var connection = mysql.createConnection({
  host     : db.host,
  user     : db.user,
  password : db.password,
  database : db.database
});

// start here
connection.connect(function(error, results) {
  if(error) {
    sys.log('Connection Error: ' + error.message);
    return;
  }
  getAllDefectsFromDatabase(connection);
});

initializeHistoryDate = function (date) {
  history.allDates.push(time.toDateString(date));
  history[time.toDateString(date)] = {
//    "created": {
      "Blocker":  0,
      "Critical": 0,
      "Major":    0,
      "Normal":   0,
      "Minor":    0,
      "Trivial":  0
/*    }, 
    "closed":{
      "Blocker":  0,
      "Critical": 0,
      "Major":    0,
      "Normal":   0,
      "Minor":    0,
      "Trivial":  0
    }*/
  };
};

// state = "created" | "closed"
updateHistoryDate = function(date, severity, state) {
  if( typeof history[time.toDateString(date)] == 'undefined' ) {
    initializeHistoryDate(date);
  }
/*  if( state == "created" ||  state == "closed") {
    history[time.toDateString(date)][state][severity]++;
  }*/
  if( state == "created" )
    history[time.toDateString(date)][severity]++;
  else
    history[time.toDateString(date)][severity]--;
};

updateDefects = function (defectState) {
  var defectExists = false;

  // handle with defect without severity
  if( defectState.severity == "") {
    defectState.severity = "Normal";
  }

  // parse all recorded defects
  defects.forEach(function(defect) {
    if( defect.id == defectState.id ) {  // this defect has already been parsed and recorded
      defect.state = defectState.toState;
      if( defect.isClosed == false && redmine.isClosed(defectState.toState) == true ) {
        // defect goes from open to closed
        defect.closedOn = time.resetTimeInDate(defectState.modifiedOn);
        defect.fixDelay =  time.getDateIntervalInDays(time.resetTimeInDate(defectState.createdOn), time.resetTimeInDate(defectState.modifiedOn));
        defect.isClosed = true;
        updateHistoryDate(defectState.modifiedOn, defectState.severity, "closed");
      }
      defect.severity =  defectState.severity;
      defect.subject =   defectState.subject;
      //console.log('[#' + defect.id+'] created on : '+ defect.createdOn +', status : ' + red + Redmine.invRedmineStatusId[defect.state] + reset + ' (till '+ defect.closedOn +') - severity : ' + green + defect.severity + reset);
      defectExists = true;
      return;
    }
  });

  if( !defectExists ) { // this defect has never been parsed nor recorded
    // initialize date in history and say a record
    updateHistoryDate(defectState.createdOn, defectState.severity, "created");
    // record defect in local db
    if( redmine.isClosed(defectState.toState) == true ) {      
      defects.push({
        "id":        defectState.id,
        "createdOn": time.resetTimeInDate(defectState.createdOn),
        "state":     defectState.toState,
        "closedOn":  time.resetTimeInDate(defectState.modifiedOn),
        "severity":  defectState.severity,
        "subject":   defectState.subject,
        "isClosed":  true,
        "fixDelay":  time.getDateIntervalInDays(time.resetTimeInDate(defectState.createdOn), time.resetTimeInDate(defectState.modifiedOn))
      });
      updateHistoryDate(defectState.createdOn, defectState.severity, "closed");
    }
    else{
      defects.push({
        "id":        defectState.id,
        "createdOn": time.resetTimeInDate(defectState.createdOn),
        "state":     defectState.toState,
        "closedOn":  time.resetTimeInDate(defectState.createdOn),
        "severity":  defectState.severity,
        "subject":   defectState.subject,
        "isClosed":  false,
        "fixDelay":  0
      });
    }
  }

  return true;
};

getAllDefectsFromDatabase = function(connection) {
  // select all defects to initialize the database
  var query = [
    "select ",
    db.database+".issues.id as journalized_id,",
    db.database+".issues.subject,",
    db.database+".issues.created_on, ",
    db.database+".issues.created_on as modified_on, ",
    db.database+".custom_values.value as severity ",
    "from ",
    db.database+".issues,",
    db.database+".custom_values ",
    "where ",
    db.database+".issues.tracker_id='"+db.defect_tracker_id+"' ",
    "and "+db.database+".issues.project_id='"+db.project_id+"' ",
    "and "+db.database+".custom_values.custom_field_id='"+db.custom_field_id+"' ",
    "and "+db.database+".custom_values.customized_id = "+db.database+".issues.id ",
    "and "+db.database+".issues.status_id!='"+db.terminated_status_id+"'"
     ].join('');
  connection.query(query, function selectCb(error, results, fields) {
    if (error) {
        sys.log('GetData Error: ' + error.message);
        client.end();
        return;
    }

    for (i = 0; i < results.length ; i++ ) {
      var result = results[i];
      var defectState = {
        "id":           result['journalized_id'],
        "subject":      result['subject'],
        "modifiedOn":   time.resetTimeInDate(result['modified_on']),
        "fromState":    1,
        "toState":      1,
        "createdOn":    time.resetTimeInDate(result['created_on']),
        "severity":     result['severity']
      };
      updateDefects(defectState);
    }
    getDefectsUpdateHistory(connection);
  });
};

getDefectsUpdateHistory = function(connection) {
  // select all non terminated defects
  var query = [
    "select ",
    db.database+".journals.journalized_id,",
    db.database+".journals.created_on as modified_on,",
    db.database+".journal_details.old_value,",
    db.database+".journal_details.value,",
    db.database+".issues.subject,",
    db.database+".issues.created_on, ",
    db.database+".custom_values.value as severity ",
    "from ",
    db.database+".issues,",
    db.database+".journals,",
    db.database+".journal_details, ",
    db.database+".custom_values ",
    "where ",
    db.database+".journals.journalized_id = "+db.database+".issues.id ",
    "and "+db.database+".journals.id = "+db.database+".journal_details.journal_id ",
    "and "+db.database+".journal_details.prop_key = 'status_id' ",
    "and "+db.database+".issues.tracker_id='"+db.defect_tracker_id+"' ",
    "and "+db.database+".issues.project_id='"+db.project_id+"' ",
    "and "+db.database+".custom_values.custom_field_id='"+db.custom_field_id+"' ",
    "and "+db.database+".custom_values.customized_id = "+db.database+".issues.id ",
    "and "+db.database+".issues.status_id!='"+db.terminated_status_id+"'"
     ].join('');
  connection.query(query, function selectCb(error, results, fields) {
    if (error) {
        sys.log('GetData Error: ' + error.message);
        client.end();
        return;
    }

    for (i = 0; i < results.length ; i++ ) {
      var result = results[i];
      var defectState = {
        "id":          result['journalized_id'],
        "subject":     result['subject'],
        "modifiedOn":  time.resetTimeInDate(result['modified_on']),
        "fromState":  result['old_value'],
        "toState":  result['value'],
        "createdOn":  time.resetTimeInDate(result['created_on']),
        "severity":    result['severity']
      };
      updateDefects(defectState);
    }
    closeConnection(connection);
  });
};

closeConnection = function(connection) {
  connection.end();
  letsCompute();
};

letsCompute = function() {
  var now = new Date();
  defects.forEach(function(defect) {
    stats.total++;
    //console.log('[#' + defect.id+'] created on : '+ defect.createdOn +', status : ' + red + redmine.invRedmineStatusId[defect.state] + reset + ' (till '+ defect.closedOn +') - severity : ' + green + defect.severity + reset + " | time to fix : " + blue + defect.fixDelay + reset);
    /*if( defect.severity === "" ) {
      defect.severity = "Normal";
    }*/
    if( defect.isClosed == true ) {
      stats[defect.severity].closed++;
      stats[defect.severity].averageTimeToFix+=defect.fixDelay;
    }
    else {
      stats[defect.severity].opened++;
      stats[defect.severity].averageTimeToFix+=time.getDateIntervalInDays(defect.createdOn, now);
    }
  });
  displayCsv();
};

displayStatistics = function() {
  stats['Blocker'].averageTimeToFix=Math.round(stats['Blocker'].averageTimeToFix/(stats['Blocker'].closed+stats['Blocker'].opened)*5/7);
  stats['Critical'].averageTimeToFix=Math.round(stats['Critical'].averageTimeToFix/(stats['Critical'].closed+stats['Critical'].opened)*5/7);
  stats['Major'].averageTimeToFix=Math.round(stats['Major'].averageTimeToFix/(stats['Major'].closed+stats['Major'].opened)*5/7);
  stats['Normal'].averageTimeToFix=Math.round(stats['Normal'].averageTimeToFix/(stats['Normal'].closed+stats['Normal'].opened)*5/7);
  stats['Minor'].averageTimeToFix=Math.round(stats['Minor'].averageTimeToFix/(stats['Minor'].closed+stats['Minor'].opened)*5/7);
  stats['Trivial'].averageTimeToFix=Math.round(stats['Trivial'].averageTimeToFix/(stats['Trivial'].closed+stats['Trivial'].opened)*5/7);

  console.log("");
  console.log("--------STATISTIQUES---------");
  console.log("> " + stats.total+ " defects");
  console.log("1/ Blocker (average Time To Fix : " + stats['Blocker'].averageTimeToFix + " days)");
  console.log("Open : " + stats['Blocker'].opened + " / Close : " + stats['Blocker'].closed);
  console.log("");
  console.log("2/ Critical (average Time To Fix : " + stats['Critical'].averageTimeToFix + " days)");
  console.log("Open : " + stats['Critical'].opened + " / Close : " + stats['Critical'].closed);
  console.log("");
  console.log("3/ Major (average Time To Fix : " + stats['Major'].averageTimeToFix + " days)");
  console.log("Open : " + stats['Major'].opened + " / Close : " + stats['Major'].closed);
  console.log("");
  console.log("4/ Normal (average Time To Fix : " + stats['Normal'].averageTimeToFix + " days)");
  console.log("Open : " + stats['Normal'].opened + " / Close : " + stats['Normal'].closed);
  console.log("");
  console.log("5/ Minor (average Time To Fix : " + stats['Minor'].averageTimeToFix + " days)");
  console.log("Open : " + stats['Minor'].opened + " / Close : " + stats['Minor'].closed);
  console.log("");
  console.log("6/ Trivial (average Time To Fix : " + stats['Trivial'].averageTimeToFix + " days)");
  console.log("Open : " + stats['Trivial'].opened + " / Close : " + stats['Trivial'].closed);
  console.log("");
};


displayCsv = function() {
  var blockerTimeline   = 0,
      criticalTimeline  = 0,
      majorTimeline     = 0,
      normalTimeline    = 0,
      minorTimeline     = 0,
      trivialTimeline   = 0;

  console.log("date ; Blocker ; Critical ; Major ; Normal ; Minor ; Trivial ; Total");
  history.allDates.forEach(function(hist) {
    blockerTimeline   += history[hist].Blocker;
    criticalTimeline  += history[hist].Critical;
    majorTimeline     += history[hist].Major;
    normalTimeline    += history[hist].Normal;
    minorTimeline     += history[hist].Minor;
    trivialTimeline   += history[hist].Trivial;

    console.log(hist+" ; " + blockerTimeline + " ; " + criticalTimeline + " ; " + majorTimeline + " ; " + normalTimeline + " ; " + minorTimeline + " ; " + trivialTimeline + " ; " + (blockerTimeline + criticalTimeline + majorTimeline + normalTimeline + minorTimeline + trivialTimeline));
  });
};


var sys = require("sys");

var mysql = require('mysql');

var defects = [];

var stats = {
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

var status = {
  "new":          1,
  "ready":        2,
  "on_going":     3,
  "to_be_tested": 4,
  "done":         5,
  "completed":    6,
  "delivered":    7,
  "verified":     8,
  "terminated":   9,
  "waiting":      10,
  "waiting_ta":   11,
  "mw_ready":     12,
  "mw_done":      13,
  "ui_ready":     14,
  "waiting_mw":   15,
  "failed":       16
};

var invStatus = [
  "null"         ,
  "new"          ,
  "ready"        ,
  "on_going"     ,
  "to_be_tested" ,
  "done"         ,
  "completed"    ,
  "delivered"    ,
  "verified"     ,
  "terminated"   ,
  "waiting"      ,
  "waiting_ta"   ,
  "mw_ready"     ,
  "mw_done"      ,
  "ui_ready"     ,
  "waiting_mw"   ,
  "failed"       
];

var green   = '\u001b[32m';
var red     = '\u001b[31m';
var blue    = '\u001b[34m';
var reset   = '\u001b[0m';

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'db_redmine'
});

sys.log('Connecting to MySQL...');
 
connection.connect(function(error, results) {
  if(error) {
    sys.log('Connection Error: ' + error.message);
    return;
  }
  sys.log('Connected to MySQL');
  connectionReady(connection);
});

var defects = [];
var averageFixDelay = 0;

isClosed = function (state) {
  var closed =  (state == status.to_be_tested ||
          state == status.done  ||
          state == status.completed  ||
          state == status.delivered  ||
          state == status.verified ) ? true : false;
  return closed;
};

getDateIntervalInDays = function (start, end) {
  return (end-start)/(1000*60*60*24);
};

updateDefects = function (defectState) {
  var defectExists = false;

  defects.forEach(function(defect) {
    if( defect.id == defectState.id ) {
      defect.state = defectState.toState;
      if( defect.isClosed == false && isClosed(defectState.toState) == true ) {
        // defect goes from open to closed
        defect.closedOn = defectState.modifiedOn;
        defect.fixDelay =  getDateIntervalInDays(defectState.createdOn, defectState.modifiedOn);
        defect.isClosed = true;
      }
      defect.severity =  defectState.severity;
      defect.subject =   defectState.subject;
      //console.log('[#' + defect.id+'] created on : '+ defect.createdOn +', status : ' + red + invStatus[defect.state] + reset + ' (till '+ defect.closedOn +') - severity : ' + green + defect.severity + reset);
      defectExists = true;
      return;
    }
  });

  if( !defectExists ) {
    if( isClosed(defectState.toState) == true ) {      
      defects.push({
        "id":        defectState.id,
        "createdOn":  defectState.createdOn,
        "state":     defectState.toState,
        "closedOn":  defectState.modifiedOn,
        "severity":  defectState.severity,
        "subject":   defectState.subject,
        "isClosed":  true,
        "fixDelay":  getDateIntervalInDays(defectState.createdOn, defectState.modifiedOn)
      });
    }
    else{
      defects.push({
        "id":        defectState.id,
        "createdOn":  defectState.createdOn,
        "state":     defectState.toState,
        "closedOn":  defectState.createdOn,
        "severity":  defectState.severity,
        "subject":   defectState.subject,
        "isClosed":  false,
        "fixDelay":  0
      });
    }
  }

  return true;
};

connectionReady = function(connection) {
  // select all defects to initialize the database
  sys.log("connectionReady ...");
  var query = [
    "select ",
    "db_redmine.issues.id as journalized_id,",
    "db_redmine.issues.subject,",
    "db_redmine.issues.created_on, ",
    "db_redmine.issues.created_on as modified_on, ",
    "db_redmine.custom_values.value as severity ",
    "from ",
    "db_redmine.issues,",
    "db_redmine.custom_values ",
    "where ",
    "db_redmine.issues.tracker_id='1' ",
    "and db_redmine.issues.project_id='9' ",
    "and db_redmine.custom_values.custom_field_id='26' ",
    "and db_redmine.custom_values.customized_id = db_redmine.issues.id ",
    "and db_redmine.issues.status_id!='9'"
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
        "modifiedOn":   result['modified_on'],
        "fromState":    1,
        "toState":      1,
        "createdOn":    result['created_on'],
        "severity":     result['severity']
      };
      updateDefects(defectState);
    }
    sys.log("connectionReady ... done");
    connectionReady2(connection);
  });
};

connectionReady2 = function(connection) {
  // select all non terminated defects
  sys.log("connectionReady2 ...");
  var query = [
    "select ",
    "db_redmine.journals.journalized_id,",
    "db_redmine.journals.created_on as modified_on,",
    "db_redmine.journal_details.old_value,",
    "db_redmine.journal_details.value,",
    "db_redmine.issues.subject,",
    "db_redmine.issues.created_on, ",
    "db_redmine.custom_values.value as severity ",
    "from ",
    "db_redmine.issues,",
    "db_redmine.journals,",
    "db_redmine.journal_details, ",
    "db_redmine.custom_values ",
    "where ",
    "db_redmine.journals.journalized_id = db_redmine.issues.id ",
    "and db_redmine.journals.id = db_redmine.journal_details.journal_id ",
    "and db_redmine.journal_details.prop_key = 'status_id' and db_redmine.issues.tracker_id='1' ",
    "and db_redmine.issues.project_id='9' ",
    "and db_redmine.custom_values.custom_field_id='26' ",
    "and db_redmine.custom_values.customized_id = db_redmine.issues.id ",
    "and db_redmine.issues.status_id!='9'"
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
        "modifiedOn":  result['modified_on'],
        "fromState":  result['old_value'],
        "toState":  result['value'],
        "createdOn":  result['created_on'],
        "severity":    result['severity']
      };
      updateDefects(defectState);
    }
    sys.log("connectionReady2 ... done");
    closeConnection(connection);
  });
};

closeConnection = function(connection) {
  sys.log('closeConnection...');
  connection.end();
  sys.log('Connection closed');
  var now = new Date();
  var total = 0;

  defects.forEach(function(defect) {
    total++;
    //console.log('[#' + defect.id+'] created on : '+ defect.createdOn +', status : ' + red + invStatus[defect.state] + reset + ' (till '+ defect.closedOn +') - severity : ' + green + defect.severity + reset + " | time to fix : " + blue + defect.fixDelay + reset);
    if( defect.severity === "" ) {
      defect.severity = "Normal";
    }
    if( defect.isClosed == true ) {
      stats[defect.severity].closed++;
      stats[defect.severity].averageTimeToFix+=defect.fixDelay;
    }
    else {
      stats[defect.severity].opened++;
      stats[defect.severity].averageTimeToFix+=getDateIntervalInDays(defect.createdOn, now);
    }
  });

  stats['Blocker'].averageTimeToFix=Math.round(stats['Blocker'].averageTimeToFix/(stats['Blocker'].closed+stats['Blocker'].opened)*5/7);
  stats['Critical'].averageTimeToFix=Math.round(stats['Critical'].averageTimeToFix/(stats['Critical'].closed+stats['Critical'].opened)*5/7);
  stats['Major'].averageTimeToFix=Math.round(stats['Major'].averageTimeToFix/(stats['Major'].closed+stats['Major'].opened)*5/7);
  stats['Normal'].averageTimeToFix=Math.round(stats['Normal'].averageTimeToFix/(stats['Normal'].closed+stats['Normal'].opened)*5/7);
  stats['Minor'].averageTimeToFix=Math.round(stats['Minor'].averageTimeToFix/(stats['Minor'].closed+stats['Minor'].opened)*5/7);
  stats['Trivial'].averageTimeToFix=Math.round(stats['Trivial'].averageTimeToFix/(stats['Trivial'].closed+stats['Trivial'].opened)*5/7);

  console.log("");
  console.log("--------STATISTIQUES---------");
  console.log("> " + total+ " defects");
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
  sys.log('closeConnection...done');
};


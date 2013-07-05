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

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'db_redmine'
});

sys.log('Connecting to MySQL...');
 
connection.connect(function(error, results) {
  if(error) {
    console.log('Connection Error: ' + error.message);
    return;
  }
  sys.log('Connected to MySQL');
  connectionReady(connection);
});

var defects = [];
var averageFixDelay = 0;

isClosed = function (state) {
  return (state === status.to_be_tested ||
          state === status.done  ||
          state === status.completed  ||
          state === status.delivered  ||
          state === status.verified ) ? true : false;
};

getDateIntervalInDays = function (end, start) {
  return (end-start)/(1000*60*60*24);
};

updateDefects = function (defectState) {
  var defectExists = false;

  defects.forEach(function(defect) {
    if( defect.id == defectState.id ) {
      defect.state = defectState.toState;
      defect.closedOn = isClosed(defectState.toState) ? defectState.modifiedOn : "n/a";
      defect.severity =  defectState.severity;
      defect.subject =   defectState.subject;
      defect.fixDelay =  isClosed(defectState.toState) ? getDateIntervalInDays(defectState.createdOn, defectState.modifiedOn) : 0;
      defectExists = true;
      console.log("   - Found id " + defect.id + "(state = "+ defect.state +" / fix delay = "+defect.fixDelay+")\n");
      return;
    }
  });

  if( !defectExists ) {
    defects.push({
      "id":        defectState.id,
      "openedOn":  defectState.createdOn,
      "state":     defectState.toState,
      "closedOn":  isClosed(defectState.toState) ? defectState.modifiedOn : "n/a",
      "severity":  defectState.severity,
      "subject":   defectState.subject,
      "fixDelay":  isClosed(defectState.toState) ? getDateIntervalInDays(defectState.modifiedOn, defectState.createdOn) : 0
    });
    console.log("   - New one"+ defectState.id + "(state = "+ defectState.toState +" / fix delay = "+isClosed(defectState.toState) ? getDateIntervalInDays(defectState.modifiedOn, defectState.createdOn) : 0+")\n");
  }

  return true;
};

connectionReady = function(connection) {
  // select all non terminated defects
  connection.query([
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
     ].join(''), function selectCb(error, results, fields) {
      if (error) {
          console.log('GetData Error: ' + error.message);
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
        console.log(i + ' / ' + results.length + '[#' + defectState.id+'] ' + defectState.severity);
        updateDefects(defectState);
      }
      closeConnection(connection);
  });
};

closeConnection = function(connection) {
  connection.end();
  sys.log('Connection closed');
  var now = new Date();

  defects.forEach(function(defect) {
   var severity = defect.severity;

   if( defect.severity === "" ) {
     severity = "Normal";
    }
    console.log('[#' + defect.id+'] status = ' + defect.state + 'severity = ' + severity);
    if( defect.state === status.to_be_tested ||
        defect.state === status.done  ||
        defect.state === status.completed  ||
        defect.state === status.delivered  ||
        defect.state === status.verified) {
      console.log("CLOSED !");
      stats[severity].closed++;
      stats[severity].averageTimeToFix+=defect.fixDelay;
    }
    else {
      console.log("OPEN ! severity = " + severity);
      stats[severity].opened++;
      stats[severity].averageTimeToFix+=getDateIntervalInDays(now, defect.createdOn);
    }
  });

  stats['Blocker'].averageTimeToFix/=(stats['Blocker'].closed+stats['Blocker'].opened);
  stats['Critical'].averageTimeToFix/=(stats['Critical'].closed+stats['Critical'].opened);
  stats['Major'].averageTimeToFix/=(stats['Major'].closed+stats['Major'].opened);
  stats['Normal'].averageTimeToFix/=(stats['Normal'].closed+stats['Normal'].opened);
  stats['Minor'].averageTimeToFix/=(stats['Minor'].closed+stats['Minor'].opened);
  stats['Trivial'].averageTimeToFix/=(stats['Trivial'].closed+stats['Trivial'].opened);

  console.log("--------STATISTIQUES---------");
  console.log("1/ Blocker");
  console.log("Open : " + stats['Blocker'].opened + " / Close : " + stats['Blocker'].closed);
  console.log("Average Time To Fix : " + stats['Blocker'].averageTimeToFix);
  console.log("2/ Critical");
  console.log("Open : " + stats['Critical'].opened + " / Close : " + stats['Critical'].closed);
  console.log("Average Time To Fix : " + stats['Critical'].averageTimeToFix);
  console.log("3/ Major");
  console.log("Open : " + stats['Major'].opened + " / Close : " + stats['Major'].closed);
  console.log("Average Time To Fix : " + stats['Major'].averageTimeToFix);
  console.log("4/ Normal");
  console.log("Open : " + stats['Normal'].opened + " / Close : " + stats['Normal'].closed);
  console.log("Average Time To Fix : " + stats['Normal'].averageTimeToFix);
  console.log("5/ Minor");
  console.log("Open : " + stats['Minor'].opened + " / Close : " + stats['Minor'].closed);
  console.log("Average Time To Fix : " + stats['Minor'].averageTimeToFix);
  console.log("6/ Trivial");
  console.log("Open : " + stats['Trivial'].opened + " / Close : " + stats['Trivial'].closed);
  console.log("Average Time To Fix : " + stats['Trivial'].averageTimeToFix);
};


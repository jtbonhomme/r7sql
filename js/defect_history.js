var sys = require("sys");

var mysql      = require('mysql');

var defects = [];

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
  ConnectionReady(connection);
});

ConvertStrDateToDayNum = function(strDate) {
  return 0;
}

var defectHistory = function () {
  // Private
  var states = [];
  return {
    addState : function () {
      return name;
    }
  };
}();

ConnectionReady = function(connection) {
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

      for (i = 0; i < results.length ; i++ )
      {
        var result = results[i];
        var defectState = {
          "id":          result['journalized_id'],
          "subject":     result['subject'],
          "modifiedOn":  result['modified_on'],
          "fromState":  result['old_value'],
          "toState":  result['value'],
          "createdOn":  result['created_on'],
          "severity":    result['severity'],
          "fixDelay": undefined
        };

        console.log('['+i+'] Id: ' + defectState.id + ' : ' + defectState.severity +
                    ' from state ' + defectState.fromState + ' to state ' + defectState.toState +
                    ' (' + defectState.modifiedOn + ')');
      }
      CloseConnection(connection);
  });
};

CloseConnection = function(connection) {
  connection.end();
  sys.log('Connection closed');
};


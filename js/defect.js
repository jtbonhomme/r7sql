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
  database : 'db_remine'
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

ConnectionReady = function(connection) {
  // select all non terminated defects
  connection.query(
    "SELECT * FROM db_remine.issues WHERE db_remine.issues.tracker_id='1' AND db_remine.issues.project_id='9' AND db_remine.issues.status_id!='"+status.terminated+"'",
    function selectCb(error, results, fields) {
      if (error) {
          console.log('GetData Error: ' + error.message);
          client.end();
          return;
      }

      for (i = 0; i < results.length ; i++ )
      {          
        var result = results[i];
        var defect = {
          "id":          result['id'],
          "subject":     result['subject'],
          "created_on":  result['created_on'],
          "severity":    result['severity'],
          "time_to_fix": undefined
        };

        console.log('['+i+'] Id: ' + defect.id + ' : ' + defect.subject + ' (' + defect.created_on+')');
        connection.query(
          "select db_remine.journals.created_on, db_remine.journal_details.old_value, db_remine.journal_details.value from db_remine.journals, db_remine.journal_details where db_remine.journals.journalized_id = "+defect.id+" and db_remine.journals.id = db_remine.journal_details.journal_id and db_remine.journal_details.prop_key = 'status_id'",
          function selectCb(error, results, fields) {
            if (error) {
                console.log('GetData Error: ' + error.message);
                client.end();
                return;
            }
            for (i = 0; i < results.length ; i++ )
            {          
              var result = results[i];
              console.log('    - ' + result['created_on']+' status changed from ' + result['old_value'] + ' to ' + result['value']);
            }
        });
        var day = {
          "day": defect.created_on,
          "defects":1
        }
      }
      CloseConnection(connection);
  });
};

CloseConnection = function(connection) {
  connection.end();
  sys.log('Connection closed');
};


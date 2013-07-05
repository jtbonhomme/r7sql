var sys = require("sys");

var mysql      = require('mysql');

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

ConnectionReady = function(connection) {
  connection.query(
    "SELECT * FROM db_remine.issues WHERE db_remine.issues.tracker_id='1' AND db_remine.issues.project_id='9'",
    function selectCb(error, results, fields) {
      if (error) {
          console.log('GetData Error: ' + error.message);
          client.end();
          return;
      }
/*    
      // DEBUG
      sys.log(sys.inspect(results));
*/       
      for (i = results.length-1; i >= 0 ; i-- )
      {          
        var result = results[i];
        sys.log('['+i+'] Id: ' + result['id'] + ' : ' + result['subject']);
      }
      CloseConnection(connection);
  });
};

CloseConnection = function(connection) {
  connection.end();
  sys.log('Connection closed');
};


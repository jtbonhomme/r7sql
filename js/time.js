/*
 * Very simple time manipulation routines
 */

function Time() {
}

// reset time in a date (00:00:00)
Time.prototype.resetTimeInDate = function(fullDate) {
  var day = fullDate.getDate();
  var month = fullDate.getMonth();
  var year = fullDate.getFullYear();
  var roundedDate = new Date(year, month, day);
  return roundedDate;
};

// Convert a tc date in a string YYYY-MM-DD
Time.prototype.toDateString = function(fullDate) {
  var day = fullDate.getDate();
  var month = fullDate.getMonth()+1;
  var year = fullDate.getFullYear();
  var strDate = year+"-";
  if( month < 10 ) {
  	strDate += "0";
  }
  strDate += month+"-";
  if( day < 10 ) {
  	strDate += "0";
  }
  strDate += day;
  return strDate;
};

// Return number of days between 2 dates
Time.prototype.getDateIntervalInDays = function (start, end) {
  return (end-start)/(1000*60*60*24);
};

module.exports = Time;
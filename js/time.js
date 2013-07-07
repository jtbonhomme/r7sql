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

Time.prototype.getDateIntervalInDays = function (start, end) {
  return (end-start)/(1000*60*60*24);
};

module.exports = Time;
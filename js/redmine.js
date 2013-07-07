/*
 * Essentials redmine status  helpers
 */

function Redmine() {
  this.redmineStatusId = {
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

  this.invRedmineStatusId = [
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
}


Redmine.prototype.isClosed = function (state) {
  var closed =  (state == this.redmineStatusId.to_be_tested ||
          state == this.redmineStatusId.done  ||
          state == this.redmineStatusId.completed  ||
          state == this.redmineStatusId.delivered  ||
          state == this.redmineStatusId.verified ) ? true : false;
  return closed;
};

module.exports = Redmine;
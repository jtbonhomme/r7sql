/*
 * MYSQL Database data
 */

function Db() {
  this.host     = 'localhost';
  this.user     = 'root';
  this.password = '';
  this.database = 'db_redmine';
  this.project_id = 9;
  this.terminated_status_id = 9;
  this.custom_field_id = 26;
  this.defect_tracker_id = 1;
}

module.exports = Db;
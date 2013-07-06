# r7sql

## MySQL packages on MAC OS X

http://dev.mysql.com/downloads/mirror.php?id=413530

## mysql binaries

    alias mysql=/usr/local/mysql/bin/mysql
    alias mysqladmin=/usr/local/mysql/bin/mysqladmin

## Installation

   npm install
   mysql -u root -h localhost < sql/create_db_redmine.sql
   mysql -u root -h localhost db_redmine < dump.sql
   mysql -u root -h localhost < sql/delete_db_redmine.sql

const mysql = require("mysql2");


const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'ferdinar7',
    database : 'trackme'
  });
   
//   connection.connect();

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return; 
    }
    console.log('Connected to MySQL server!');
    // You can perform database operations here
  });


  module.exports = connection;
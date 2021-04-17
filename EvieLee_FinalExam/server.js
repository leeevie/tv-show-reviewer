// Lab 7:
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//Create Database Connection
// var pgp = require('pg-promise')();

// const dbConfig = {
// 	host: 'db',
// 	port: 5432,
// 	database: 'football_db',
// 	user: 'postgres',
// 	password: 'pwd'
// };

// var db = pgp(dbConfig);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));

app.get('/main', function(req, res) {
    res.render("/views/pages/main", {
        page_title: "Main"
    });
});

app.get('/main/search', function(req, res) {
    
})

app.get('/reviews', function(req, res) {
    res.render("/views/pages/reviews", {
        page_title: "Reviews"
    });
});

//connecting to port 3000
app.listen(3000, function() {
  console.log("Server started on port 3000" + __dirname);
});
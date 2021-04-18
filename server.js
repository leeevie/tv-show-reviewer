require('dotenv').config();
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const axios = require('axios');

// Lab 10 database setup
var pgp = require('pg-promise')();

const dev_dbConfig = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
	user:  process.env.DB_USER,
	password: process.env.DB_PASSWORD
};

const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

if (isProduction) {
  pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}
const db = pgp(dbConfig);



app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
    res.redirect("/home");
});

app.get('/home', function(req, res) {
    res.render("pages/main", {
        page_title: "Home",
        show: ''
    });
});

// Architecture 2: axios api call
app.post('/search', function(req, res) {
    var title = req.body.title;

    if (title) {
        axios({
            url: `http://api.tvmaze.com/search/shows?q=${title}`,
            method: 'GET',
            dataType: 'json'
        })
        .then(items => {
            res.render('pages/main', {
                page_title: "Home",
                show: items.data[0].show,
            })
        })
        .catch(error => {
            console.log(error);
            res.render('pages/main', {
                page_title: "Home",
                show: ''
            })
        })
    } else {
        res.render('pages/main', {
            page_title: "Home",
            show: ''
        })
    }
})

// search api for testing
app.post('/searchTest', function(req, res) {
    var title = req.body.title;

    // still api call
    if (title) {
        axios({
            url: `http://api.tvmaze.com/search/shows?q=${title}`,
            method: 'GET',
            dataType: 'json'
        })
        .then(items => {
            // send json instead of rendering page, etc
            res.status(200).json(items.data[0].show);
        })
        .catch(error => {
            res.status(404).json({ err : error });
        })
    } else {
        res.status(400).json({ err: "no title"});
    }
})

// Lab 6: Postgres
app.post('/add-review', function(req, res) {
    var show_name = req.body.show_name;
    var review = req.body.review;
    var review_date = Math.floor(Date.now() / 1000);

    var insert = `INSERT INTO reviews(tv_show, review, review_date) values (\'${show_name}\', \'${review}\', to_timestamp(${review_date} / 1000.0));`;
    
	db.any(insert)
    .then(function (rows) {
        res.redirect('/reviews');
    })
    .catch(function (err) {
        console.log(err);
        res.redirect('/home');
    })

    // pool.query(insert, (err, results)=>{
    //     if(err){
    //         res.redirect('/home');
    //     }
    //     else {
    //         res.redirect('/reviews');
    //     } 
    // })
})

app.get('/reviews', function(req, res) {
    var select = 'SELECT * FROM reviews;';

	db.any(select)
    .then(function (rows) {
        res.render('pages/reviews', {
            page_title: "Reviews",
            items: rows
        })
    })
    .catch(function (err) {
        console.log(err);
        
    })

    
    // pool.query(select, (err, rows)=>{
    //     if(rows){
    //         // console.log(rows.rows);
    //         res.render('pages/reviews', {
    //             page_title: "Reviews",
    //             items: rows.rows
    //         })
    //     }
    //     else {
    //         res.render('pages/reviews', {
    //             page_title: "Reviews",
    //             items: ''
    //         })
    //     } 
    // })
});

// for testing....
app.get('/reviewsTest', function(req, res) {
    var select = 'SELECT * FROM reviews;';

	db.any(select)
    .then(function (rows) {
        res.status(200).send(rows)
    })
    .catch(function (err) {
        res.status(404).json({ err : error });
    })

    // pool.query(select, (err, rows)=>{
    //     if(err){
    //         res.status(404).json({ err : error });
    //     }
    //     else {
    //         res.status(200).send(rows)
    //     }
    // })
    
});

app.get('/reviews/filter', function(req, res) {
    var filter = req.query.filter;
    var selectAll = 'SELECT * FROM reviews;';
    var selectFiltered = 'SELECT * FROM reviews WHERE tv_show=\'' + filter + '\';';

	db.task('get-everything', task => {
        return task.batch([
            task.any(selectAll),
            task.any(selectFiltered)
        ]);
    })
    .then(results => {
        // if any reviews come up, then display them        
        if (results[1].length > 0) {
            res.render('pages/reviews', {
                page_title: "Reviews",
                items: results[1]
            });
        }
        // otherwise, display all reviews
        else {
            res.render('pages/reviews', {
                page_title: "Reviews",
                items: results[0]
            });
        }	
    })
    .catch(err => {
        console.log(err);
        res.render('pages/reviews', {
            page_title: "Reviews",
            items: ''
        });
    });

    // pool.query(selectFiltered, (err, rows)=>{
    //     console.log(rows.rows);
    //     // if any reviews come up, then display them        
    //     if (rows.rows.length > 0) {
    //         res.render('pages/reviews', {
    //             page_title: "Reviews",
    //             items: rows.rows
    //         });
    //     }
    //     else {
    //         // console.log("Couldn't find anything :(");
    //         // res.redirect("/reviews");
    //         pool.query(selectAll, (err, results) => {
    //             res.render('pages/reviews', {
    //                 page_title: "Reviews",
    //                 items: results.rows
    //             })
    //         })
    //     }
    // });
});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});
// for mocha/chai testing
module.exports = server;
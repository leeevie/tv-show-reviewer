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
        show: '',
        message: ''
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
            var show = '';

            // find the first show with all the data needed
            for (var i = 0; i < items.data.length; i++) {
                var item = items.data[i].show;
                var valid = 0;

                // console.log(item.name);
                if (item.name) {
                    // console.log("valid name +1");
                    valid += 1;
                }
                if (item.image) {
                    if (item.image.original) {
                        // console.log("valid image +1");
                        valid += 1;
                    }
                }
                if (item.genres) {
                    // console.log("valid genres +1");
                    valid += 1;
                }
                if (item.summary) {
                    // console.log("valid summary +1");
                    valid += 1;
                }
                if (item.rating) {
                    if (item.rating.average) {
                        // console.log("valid rating +1");
                        valid += 1;
                    }
                }                

                // console.log(valid);

                if (valid == 5) {
                    // console.log("Found one");
                    show = item;
                    break;
                }
            }

            // if there isn't a result that has everything, just use the first one
            if (show == '') {
                show = items.data[0].show;
            }
            
            res.render('pages/main', {
                page_title: "Home",
                show: show,
                message: ''
            })
        })
        .catch(error => {
            console.log(error);
            res.render('pages/main', {
                page_title: "Home",
                show: '',
                message: 'We couldn\'t find any shows with that title. Please try again!'
            })
        })
    } else {
        res.render('pages/main', {
            page_title: "Home",
            show: '',
            message: 'We couldn\'t find any shows with that title. Please try again!'
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

    // dollar quotes to deal with apostrophes in show name and review
    // wanna test it out? search "The King's Avatar" or just "avatar" and add a review
    var insert = `INSERT INTO reviews(tv_show, review, review_date) values ($$${show_name}$$, $$${review}$$, current_timestamp);`;

	db.any(insert)
    .then(function (rows) {
        res.redirect('/reviews');
    })
    .catch(function (err) {
        console.log(err);
        res.render('pages/main', {
            page_title: "Home",
            show: '',
            message: 'There was an error with adding your review. Please try again!'
        })
    })

})

app.get('/reviews', function(req, res) {
    var select = 'SELECT * FROM reviews;';

	db.any(select)
    .then(function (rows) {
        res.render('pages/reviews', {
            page_title: "Reviews",
            items: rows,
            message: ''            
        })
    })
    .catch(function (err) {
        console.log(err);
        res.render('pages/reviews', {
            page_title: "Reviews",
            items: rows,
            message: 'There was an error with loading the reviews page. Please try again!'            
        })
    })

});

// for testing....
app.get('/reviewsTest', function(req, res) {
    var select = 'SELECT * FROM reviews;';

	db.any(select)
    .then(function (rows) {
        res.status(200).send(rows)
    })
    .catch(function (err) {
        res.status(404).send(err);
    })
    
});

app.get('/reviews/filter', function(req, res) {
    var filter = req.query.filter;

    // queries:
    // dollar quotes to handle ' and "
    // matches title exactly (case insensitive)
    var selectStrict = 'SELECT * FROM reviews WHERE tv_show ILIKE $$' + filter + '$$;'
    // finds similar titles (regex)
    var selectFiltered = 'SELECT * FROM reviews WHERE tv_show ILIKE $$%' + filter + '%$$;';
    // gets all reviews
    var selectAll = 'SELECT * FROM reviews;'; 

	db.task('get-everything', task => {
        return task.batch([
            task.any(selectStrict),
            task.any(selectFiltered),
            task.any(selectAll)
        ]);
    })
    .then(results => {
        var display = '';
        var msg = '';

        // if any reviews come up, then display them        
        if (results[0].length > 0) {
            display = results[0];
            msg = 'Here are your reviews!';
        }
        // if nothing, search similar titles
        else if (results[1].length > 0) {
            display = results[1];
            msg = "We couldn't find an exact match. Here are some similar titles.";
        }
        // otherwise, display all reviews
        else {
            display = results[2];
            msg = "We couldn't find any results. Displaying all reviews.";
        }

        res.render('pages/reviews', {
            page_title: "Reviews",
            items: display,
            message: msg
        });

    })
    .catch(err => {
        console.log(err);
        res.render('pages/reviews', {
            page_title: "Reviews",
            items: results[0],
            message: "There was an error with filtering the reviews page. Please try again!"
        });
    });

});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});
// for mocha/chai testing
module.exports = server;
const express = require('express');

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cheerio = require("cheerio");
const request = require("request");

var db = require("./models");


// const PORT = 8080;
var PORT = process.env.PORT || 5000;
const app = express();
// var uristring =
//     process.env.MONGOLAB_URI ||
//     process.env.MONGOHQ_URL ||
//     'mongodb://localhost/mongoose_hw';

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoose_hw";
app.use(bodyParser.urlencoded({ extended: true }));

const exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main", extname: "handlebars" }));
app.set("view engine", "handlebars");
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost/mongoose_hw");
// mongoose.connect(uristring, function (err, res) {
//     if (err) {
//         console.log('ERROR connecting to: ' + uristring + '. ' + err);
//     } else {
//         console.log('Succeeded connected to: ' + uristring);
//     }
// });
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
    useMongoClient: true
});




app.get('/', function (req, res) {
    console.log("\n******************************************\n" +
        "Grabbing every article headline and link\n" +
        "from the NHL website:" +
        "\n******************************************\n");


    // Making a request for `nhl.com`'s homepage
    request("https://www.nhl.com/", (error, response, html) => {
        // Load the body of the HTML into cheerio
        const $ = cheerio.load(html);

        // With cheerio, find each h4-tag with the class "headline-link" and loop through the results
        $("h4.headline-link").each(function (i, element) {
            const result = {};
            // Save the text of the h4-tag as "title"
            result.title = $(this).text();

            // Find the h4 tag's parent a-tag, and save it's href value as "link"
            result.link = $(this).parent().attr("href");
            result.abstract = $(this).next("h5").text();

            // Make an object with data we scraped for this h4 and push it to the results array
            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    return res.json(err);
                });
        });

        // After looping through each h4.headline-link, log the results
        res.redirect("/articles");
    });
});

app.get('/articles', function (req, res) {
    console.log('Finding the articles');
    db.Article.find({})
        .exec(function (err, articles) {
            if (err) {
                res.send('An error has occured');
            }
            else {
                let hbsObject = { data: articles };
                console.log(articles);
                res.render("index", hbsObject);
            }
        });
});

app.get('/articles/saved', function (req, res) {
    console.log('Finding the articles');
    db.Article.find({ saved: true })
        .populate("notes")
        .exec(function (err, articles) {
            if (err) {
                res.send('An error has occured');
            }
            else {
                let hbsObject = { data: articles };
                console.log(articles);
                res.render("saved", hbsObject);
            }
        });
});


app.get('/articles/:id', function (req, res) {
    console.log('Getting One Article!');
    db.Article.findOne({
        _id: req.params.id
    })
        .populate("notes")
        .exec(function (err, article) {
            if (err) {
                res.send('error');
            }
            else {
                console.log(article);
                res.json(article);
            }
        });
});

app.post('/articles/save/:id', function (req, res) {
    console.log("Saving an Article");
    db.Article.findOneAndUpdate({
        _id: req.params.id
    }, { $set: { saved: true } })
        .then(function (article) {
            console.log(article);
            res.redirect('/articles');
        })
        .catch(function (err) {
            res.json(err);
        });

});

app.post('/articles/unsave/:id', function (req, res) {
    console.log("Unsaving an Article");
    db.Article.findOneAndUpdate({
        _id: req.params.id
    }, { $set: { saved: false } })
        .then(function (article) {
            console.log(article);
            res.redirect('/articles/saved');
        })
        .catch(function (err) {
            res.json(err);
        });

});

// app.post('/articles/:id', function (req, res) {
//     console.log(req.body);
//     db.Note.create(req.body)
//         .then(function (note) {
//             return db.Article.findOneAndUpdate(
//                 { "_id": req.params.id },
//                 { $push: { notes: note } },
//                 {
//                     upsert: true, 'new': true
//                 })
//         })
//         .then(function (article) {
//             res.redirect("/articles/saved");
//         })
//         .catch(function (err) {
//             res.render(err);
//         });
// });

app.post('/note/delete/:id', function (req, res) {
    db.Note.findOneAndRemove({
        _id: req.params.id
    }, function (err, note) {
        if (err) {
            console.log(err);
            res.send('error deleting note');
        }
        else {
            console.log(note);
            res.redirect("/articles/saved");
        }
    });
});


app.delete('/article/:id', function (req, res) {
    db.Article.findOneAndRemove({
        _id: req.params.id
    }, function (err, article) {
        if (err) {
            console.log(err);
            res.send('error deleting article');
        }
        else {
            console.log(article);
            res.send(article);
        }
    });
});


app.listen(PORT, function () {
    console.log("Servers A Running Mista David!");
});



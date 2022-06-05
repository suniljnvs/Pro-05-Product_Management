const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const route = require("./routes/route");
const app = express();

const multer = require("multer");

app.use(multer().any());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://Sumit1997:NCQxFeFaC7OuIMgM@cluster0.xlut8.mongodb.net/group13Database", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDB is connected on 27017"))
    .catch(err => console.log(err))


app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
    console.log('Express App running on port ' + (process.env.PORT || 3000))
});
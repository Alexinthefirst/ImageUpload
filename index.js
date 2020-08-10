const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;
const getPixels = require('get-pixels');
const getColors = require('get-image-colors');
const bodyParser = require('body-parser');
var fs = require('fs');

//Connect to the mongodb database
mongoose.connect('mongodb://localhost:27017/images',
		{ useNewUrlParser: true, useUnifiedTopology: true }, err => {
        console.log('connected')
    });

//Setup local storage for multer
var storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

//Declare schema, will name, description, filepath, and the colours received from 'get-image-colors'
//as well as the image buffer
var imageSchema = new mongoose.Schema({
    name: String,
    desc: String,
		path: String,
		colour1: String,
		colour2: String,
		colour3: String,
		colour4: String,
		colour5: String,
    img:
    {
        data: Buffer,
        contentType: String
    }
});

//Create the model
var image = new mongoose.model('Image', imageSchema);

var upload = multer({ storage: storage })

//Set EJS view engine and bodyparser variables
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
	//Query mongoDB for everything
	image.find({}, (err, items) => {
        if (err) {
            console.log(err);
        }
				else {
					//send the items obtained from the query to the ejs file
					res.render('index', { items: items });
					}
    });
});


app.post('/', upload.single('image'), (req, res, next) => {
	var col1, col2, col3, col4, col5, obj;
	getColors((__dirname + '/public/uploads/' + req.file.filename)).then(colors => {
		col1 = colors[0].hex();
		col2 = colors[1].hex();
		col3 = colors[2].hex();
		col4 = colors[3].hex();
		col5 = colors[4].hex();
		obj = createObj(col1, col2, col3, col4, col5, req);
		image.create(obj, (err, item) => {
				if (err) {
						console.log(err);
				}
				else {
						res.redirect('/');
				}
		});
	});
});

//Creates an object using colors obtained from 'get-image-colors' and the request body
function createObj(col1, col2, col3, col4, col5, req){
	var obj = {
				colour1: col1,
				colour2: col2,
				colour3: col3,
				colour4: col4,
				colour5: col5,
        name: req.body.name,
        desc: req.body.desc,
				path: path.join('uploads/' + req.file.filename),
        img: {
            data: fs.readFileSync(path.join(__dirname + '/public/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    }
		return obj;
}

//Open port for listening
app.listen(port, () => {
  console.log('Server is Listening on Port: ' + port)
});

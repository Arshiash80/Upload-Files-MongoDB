const express = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const multer = require('multer');
const fs = require('fs')

const app = express()

const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

// Connect to MongoDD
const mongoURI = process.env.mongoURI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("DB Conected!")
  })
  .catch((err) => {
    console.error("Error while connecting to db: ", err)
  })

// Define our database schema. 
const ImageSchema  = new Schema(
  { 
    name: String,
    desc: String,
    img: 
      { data: Buffer, contentType: String } // data: Buffer - Allows us to store our image as data in the form of arrays.
  }
);
var Image = mongoose.model('Image', ImageSchema );


// Next we must define the path of the image we are uploading. 
// Here, we are using the middleware Multer to upload the photo on the server side.
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads') // Here, we use Multer to take a photo and put it in a folder called ‘uploads’
                          // so we can easily access it later. 
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now())
  }
});
var upload = multer({ storage: storage });


app.set('view engine', 'ejs'); // We need to set EJS as our templating engine
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: false})); 
app.use(express.json());

// This request is used to display all the data stored in the database. GET
app.get('/',function(req,res){
  Image.find({}, (err, items) => {
    if (err) {
        console.log(err);
    }
    else {
        res.render('index', { items: items });
    }
});
});

// Uploading the image to our database. POST
app.post('/api/photo', upload.single('file'), function(req,res){
  try {
    let image = req.file
    console.log(image)
    let newImage = new Image(); // Here, we create an instance of our Item model
    newImage.name = req.body.name
    newImage.desc = req.body.desc
    newImage.img.data = fs.readFileSync(path.join(__dirname + '/uploads/' + image.filename))
    console.log("HERE!! : ", path.join(__dirname + '/uploads/' + image.filename))
    newImage.img.contentType = 'image/jpg';
    newImage.save();
    res.redirect('/')
  } catch (error) {
    console.error(error) 
    res.send("ERROR!")
  } 
});

app.listen('4000', err => {
  if (err) {
    throw err
  }
  console.log(`App listen at port 4000`)
})
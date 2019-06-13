const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const expressValidator = require('express-validator')
const flash = require('connect-flash')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const config = require('./config/database')
const passport = require('passport')
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');



mongoose.connect(config.database);
let db = mongoose.connection;

//check connection
db.once('open',function(){
  console.log("Connected to MongoDB");
})
//check db console.error
db.on('error', function(err){
  console.log(err);
});

const app = express();

//models
let User = require('./models/user');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');



// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

//methodOverride Middleware
app.use(methodOverride('_method'));

// Express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
//Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//passport config

require('./config/passport')(passport);
//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//passport user
app.get('*', function(req,res,next){
  res.locals.user = req.user || null;
  next();
});


//----------------------------------------------------------------------------------//
// Mongo URI
const mongoURI = 'mongodb://localhost:27017/khal3';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = req.body.userName + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });



app.get('/profile', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('profile', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('profile', { files: files });
    }
  });
});



// @route POST /upload
// @desc  Uploads file to DB
app.post('/profile/upload', upload.single('file'), (req, res) => {
  // res.json({ file: req.file });
  res.redirect('/profile');
});

// @route GET /files
// @desc  Display all files in JSON
app.get('/profile/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
app.get('/profile/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/profile/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/profile/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/profile');
  });
});




















//----------------------------------------------------------------------------------//
app.get('/', function(req,res){
User.find({}, function(err,users){

if(err){
  console.log(err);
}
else{
  res.render('index',{
    title:'Welcome Users',
    users: users,
    message:req.flash('success')
      });
    }
  });
});


//register
app.get('/register', function(req,res){
  res.render('register',{
    title:'Register Here !'
  });
});



/*
//add submit POST
app.post('/users/register', function(req,res){
  //let user = new User();
  let user = new User();
  user.userName = req.body.userName;
  user.id = req.body.id;
  user.password = req.body.password;

  /*
  const userName = req.body.userName;
  const id = req.body.id;
  const password = req.body.password;
*/
/*  req.checkBody('userName','Name is required').notEmpty();
  req.checkBody('id','ID is required').notEmpty();
  req.checkBody('password','Password is required').notEmpty();
*/
/*  let errors = req.validationErrors();
  if(errors){
    res.render('register',{
      errors:errors
    });
  }
  else{
    let user = new User({
      userName:userName,
      id:id,
      password:password
    });
    req.flash('success','Successfully Registered !');
    res.redirect('/');
  }
*/
/*
  user.save(function(err){
    if(err){
      console.log(err);
      return;
    }
    else{
    req.flash('success','Successfully Registered !');
    res.redirect('/');
    }
  });
});
*/
/*
//WORKING
//add submit POST
app.post('/users/register', function(req,res){
  //let user = new User();
  let user = new User();
  user.userName = req.body.userName;
  user.id = req.body.id;
  user.password = req.body.password;

  user.save(function(err){
    if(err){
      console.log(err);
      return;
    }
    else{
    req.flash("success","Successfully Registered !");
    res.redirect('/');
    }
  });

});

*/

//WORKING
//add submit POST
app.post('/register',upload.single('file'), function(req,res){
  const userName = req.body.userName;
  const email = req.body.email;
  const password = req.body.password;


  req.checkBody('userName','UserName is required').notEmpty();
  req.checkBody('email','Email is required').notEmpty();
  req.checkBody('password','Password is required').notEmpty();

//get validationErrors
let errors = req.validationErrors();
 if(errors){
   res.render('register',{
     title:"Register Here",
     errors:errors
   });
 }else{
   let user = new User({
     userName:userName,
     email:email,
     password:password
   });

   bcrypt.genSalt(10,function(err, salt){
     bcrypt.hash(user.password, salt, function(err,hash){
       if(err){
         console.log(err);
       }
       user.password = hash;
       user.save(function(err){
         if(err){
           console.log(err);
           return;
         }
         else{
         req.flash("success","Successfully Registered !");
         res.redirect('/login');
         }
       });
     });
   });

 }
});

//Login form
app.get('/login', function(req,res){
  res.render('login',{
  message:req.flash('success')
  });
})

//Login POST process
app.post('/login',function(req,res,next){
  passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true,
    successFlash:'Successfully Logged in !'
  })(req,res,next);
});

app.get('/logout',function(req,res) {
  req.logout();
  req.flash('success','You are logged out');
  res.redirect('/login');
});

app.listen(8000, function(){
  console.log("Server Running in 8000");
});

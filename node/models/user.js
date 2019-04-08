let mongoose = require('mongoose');

//Schema

let UserSchema = mongoose.Schema({
    userName:{
      type:String,
      required:true
    },
    email:{
      type:String,
      required:true
    },
    password:{
      type:String,
      required:true
    }
});

let User = module.exports = mongoose.model('User', UserSchema);

var mongoose=require("mongoose");
var AdminSchema=new mongoose.Schema({
		_id:String,
		username:String,
		password:String
});
module.exports=mongoose.model("Admin",AdminSchema);
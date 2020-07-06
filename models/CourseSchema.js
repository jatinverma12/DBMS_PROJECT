var mongoose=require("mongoose");
var CourseSchema=new mongoose.Schema({
		id:Number,
		branch:String,
		subjects:[String],
		practicals:[String]

});
module.exports=mongoose.model("Course",CourseSchema);
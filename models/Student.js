var mongoose=require("mongoose");
var StudentSchema=new mongoose.Schema({
		id:Number,
		name:String,
		branch:String,
		sem:[
		{	
			index:Number,
			exam:[
				{
					term:String,
					marks:[
					{sub:String,num:Number}
					]
				}
			],

			practicals:[
				{
					term:String,
					marks:[
					{sub:String,num:Number}
					]
				}
			],

			attendance:{
				subjects:[{sub:String,present:Number}]
			}

		}]
	
});
module.exports=mongoose.model("Student",StudentSchema);
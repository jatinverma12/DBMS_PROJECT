var mongoose=require("mongoose");
var StudentSchema=new mongoose.Schema({
		_id:Number,
		dob:Date,
		eno:String,
		sname:String,
		fname:String,
		branch:String,
		email:String,
		contact:Number,
		total:[{
			sem:Number,
			marks_sem:[{term:String,
				m_written:[{subject:String,mark:Number}],
				m_practical:[{subject:String,mark:Number}]
			}],


		}]			
});
module.exports=mongoose.model("Student",StudentSchema);
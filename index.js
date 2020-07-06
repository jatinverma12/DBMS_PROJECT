var express = require('express');
const fs = require("fs");
var mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
var passwordHash = require('password-hash');
var app=express();
var cookieParser = require('cookie-parser');
const session=require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
const Student=require('./models/Student');
const Admin=require('./models/Admin');
const Course=require('./models/CourseSchema');
const { v4: uuidv4 } = require('uuid');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
var multer  = require('multer')
const upload = multer({ });


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.set('view engine','ejs');

const jwtKey="My_admin_is_safe";
const jwtExpirySeconds=300;

var mongodb = require('mongodb');

mongoose.connect("mongodb+srv://verma_jatin:vermajatin4621@cluster0.i6rkc.mongodb.net/<dbname>?retryWrites=true&w=majority",{
  useUnifiedTopology:true,
  useNewUrlParser:true
}).then(()=>{
  console.log("connected to DB!");
}).catch(err=>{
  console.log(err);
});

var methodOverride=require("method-override");
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, maxAge: 0.125*60*60*1000 }
}))
app.use(methodOverride("_method"));
app.use(express.static('public'));


////////////////////////////////////////ADMIN ROUTES///////////////////////////////

//////LANDING PAGE///////////////////////////
app.get('/',(req,res)=>{
	var value;
	if(req.cookies.token)
		value=1;
	else 
		value=0;
	res.render('layout',{data:value});
});

///////////ADDING ADMIN////////////////////////
app.get('/admin/add',checkAuth,(req,res)=>{
	res.render('SignupAdmin',{err:""});
});
app.post('/admin/add',checkAuth,(req,res)=>{

	Admin.findOne({username:req.body.username},(err,result)=>{
		if(!result)
		{
			req.body.password=passwordHash.generate(req.body.password);
			const obj={
				_id:uuidv4(),
				username:req.body.username,
				password:req.body.password
			}
			const ad=new Admin(obj);
			ad.save(function(err){
			if(err)
			console.log(err);
			else 
			res.redirect('/admin/list');
			});
		}
		else
			res.render('SignupAdmin',{err:"Username already taken."})
	})
	
;});

/////////////////ADMIN LIST PAGE//////////////////////////////


app.get('/admin/list',checkAuth,(req,res)=>{
	Admin.find({},function(err,result){
		if(err)
			console.log(err);
		else{
			res.render('admin',{st:result});
		}
	})
});

//////////////////////ROUTE TO DELETE AN ADMIN//////////////
app.delete('/admin/:id/delete',checkAuth,(req,res)=>{
	Admin.deleteOne({username:req.params.id},function(err,result){
		if(err)
			console.log(err);
		else
			res.redirect('/admin/list');
	})
})
/////////////REGISTER A STUDENT///////////////////////////////
app.get('/admin/register',checkAuth,(req,res)=>{
	res.render('Register');
});

app.post('/admin/register',checkAuth,(req,res)=>{
	const obj =new Student({
		_id:req.body.id,
		dob:req.body.dob,
		eno:req.body.eno,
		sname:req.body.sname,
		fname:req.body.fname,
		branch:req.body.branch,
		email:req.body.email,
		contact:req.body.contact,
		
	
	});

	obj.save(function(err){
		if(err)
			console.log(err);
		else
			res.redirect('/admin/students');

	});
	

});

////////////////////////////////ROUTE TO EDIT MARKS OF A STUDENT///////////////////////
var required_sem;
app.get('/admin/ls',checkAuth,(req,res)=>{
	res.render('LoginStudent',{err:""});
});
var check_Id;
var StudentRecord;
app.post('/admin/ls',checkAuth,(req,res)=>{
	check_Id=req.body.rid;
	required_sem=req.body.sem;
	Student.findOne({_id:check_Id},(err,rec)=>{
		StudentRecord=rec;
		if(!rec)
			 res.render('LoginStudent',{err:"Wrong Reg.no. Try again."});
		else
			//res.sendFile(__dirname+'/public/Term.html');
		{
			Course.findOne({id:req.body.sem,branch:StudentRecord["branch"].toUpperCase()},function(err,rec){
			if(!rec)
			console.log("not found");
			else
		{
				count=rec.subjects.length;
				course=rec;
				ms=req.body.ms;
				rec={...rec,"ms":req.body.ms};
				res.render('Marks',{data:rec});

			}
	});
		}
	})
});
var count;

var course,ms;

///////////////////////////ENTERING SEMESTER AND MIDSEM/////////////////////

////////////////STORING MARKS IN DB////////////////////////////////
app.post('/admin/midterm/marks',checkAuth,(req,res)=>{
	
		var m_written=[];
		var m_practical=[];
		
		var myjson=JSON.stringify(req.body);
		course.subjects.map(sub=>{
			if(!Array.isArray(req.body[`${sub}`]))
			{
				var p={subject:sub,mark:req.body[`${sub}`]}
				m_written.push(p);
			}
			else{
				var p={subject:sub,mark:req.body[`${sub}`][0]};
				var q={subject:sub,mark:req.body[`${sub}`][1]};
				m_written.push(p);
				m_practical.push(q);
			}
			
		});

		var first={
			sem:course.id,
			marks_sem:[{
				term:ms,
				m_written:m_written,
				m_practical:m_practical
			}]
		}
		if(!StudentRecord.total.length )
		{	console.log("not wala");
			Student.updateOne({_id:check_Id},{total:first},function(err,result){
				if(err)
					{console.log("error");}
				else 
				res.redirect('/admin/students');
			});
		}

		else{
			
			var flag=0;
			
			StudentRecord.total.map(record=>{
				if(record.sem==required_sem)
				{	console.log(1);
					flag=1;
					record.marks_sem.push(first.marks_sem[0]);
					Student.updateOne({_id:check_Id},{total:StudentRecord.total},function(err,result){
					if(err)
						{console.log("error");}
					else
					 res.redirect('/admin/students');
					});

				}

			});
			if(flag==0)
			{	console.log(2);
				StudentRecord.total.push(first);
				Student.updateOne({_id:check_Id},{total:StudentRecord.total},function(err,result){
					if(err)
						{console.log("error");}
						 res.redirect('/admin/students');

				});
			}
		}
});

////ADDING COURSE STRUCTURE FOR A PARTICULAR SEMESTER AND BRANCH/////////

app.get('/admin/course',checkAuth,(req,res)=>{
	res.render('Course');
});

app.post('/admin/course',checkAuth,(req,res)=>{
	const arr=req.body.wsubject.split(',');
	const arr2=req.body.psubject.split(',');
	const course=new Course({
		id:req.body._id,
		branch:req.body.branch,
		subjects:arr,
		practicals:arr2
	});
	course.save((err)=>{
		if(err)
			console.log(err);
		else
			res.redirect('/admin/students');
	})
});

/////////// ROUTE TO GET  ALL STUDENTS REGISTERED////////////////////////
app.get('/admin/students',checkAuth,(req,res)=>{
	Student.find({},function(err,result){
		if(err)
			console.log(err);
		else
			res.render('student',{st:result});
	})
});

///////////EDIT STUDENTS PERSONAL DETAILS//////////////////////

app.get('/admin/students/:id/edit',checkAuth,(req,res)=>{
	Student.findOne({_id:req.params.id},function(err,result){
		if(!result)
			console.log(err);
		else
			res.render('StudentEdit',{st:result});
	});

});

/////////////////UPDATING THE DETAILS IN DATABASE///////////////////
app.put('/admin/students/:id',checkAuth,(req,res)=>{
	Student.updateOne({_id:req.params.id},req.body,function(err,result){
				if(err)
					{console.log("error");}
				res.redirect('/admin/students');
			});
});

///////////////////ROUTE TO EDIT MARKS OF A STUDENT/////////////////

app.get('/admin/marks/edit',checkAuth,(req,res)=>{
	res.render('EditTerm',{err:""});
});
var cid;
var sr;

app.post('/admin/marks/edit',checkAuth,(req,res)=>{

	cid=req.body.rid;
	Student.findOne({_id:cid},(err,rec)=>{
		sr=rec;
		if(!rec)
			 res.render('EditTerm',{err:"Wrong Reg.no. Try again."});
		else
		{	
			var obj={
				temp:req.body,
				data:rec
			}
			console.log(obj);
			res.render('EditMarks',{obj:obj});
		}
	})

});

/////////////UPDATING THE CHANGED MARKS IN DATABASE//////////////////

app.put('/admin/marks/edit/:id',checkAuth,(req,res)=>{
	var subjects=Object.keys(req.body);

	var m_written=[];
		var m_practical=[];
			
	for(var i=2;i<subjects.length;i++)
	{

		if(!Array.isArray(req.body[subjects[i]])){
				var p={subject:subjects[i],mark:req.body[subjects[i]]}
				m_written.push(p);
			}
			else{
				var p={subject:subjects[i],mark:req.body[subjects[i]][0]};
				var q={subject:subjects[i],mark:req.body[subjects[i]][1]};
				m_written.push(p);
				m_practical.push(q);
			}
	}

	console.log(m_written);
	console.log(m_practical);

	sr.total.map(record=>{
		if(record.sem==req.body.sem){
			record.marks_sem.map(r=>{
				if(r.term==req.body.term){
					r.m_written=m_written;
					r.m_practical=m_practical;
					
				}
			})
		}
	});

	sr.total.map(record=>{
		if(record.sem==req.body.sem){
			record.marks_sem.map(r=>{
				if(r.term==req.body.term){
					console.log(r.m_written);
					console.log(r.m_practical);
					
				}
			})
		}
	});



	Student.updateOne({_id:req.params.id},{total:sr.total},function(err,result){
		if(err)
			console.log(err);
		else
			res.redirect('/admin/students');
	})
});

app.delete('/admin/students/:id/delete',checkAuth,(req,res)=>{
	Student.deleteOne({_id:req.params.id},function(err,result){
		if(err)
			console.log(err);
		else
			res.redirect('/admin/students');
	})
})

/////////////////ROUTE TO GO ON EVENT PAGE////////////////

app.get('/admin/event',checkAuth,(req,res)=>{
	res.render('Event');
});

///ROUTE TO POST THE DETAILS AND SEND THEM TO STUDENTS VIA EMAIL ON THEIR EMAIL ID'S
app.post('/admin/event',upload.single('avatar'),(req,res)=>{
	console.log(req.file);
	const encoded = req.file.buffer.toString('base64');
	const msg = {
	  to: 'vermajatin4621@gmail.com',
	  from: 'jatinverma4621@gmail.com',
	  subject: `${req.body.name}`,
	  text: `${req.body.description}`,
	  html: `

	  <h1>Date:${req.body.date}</h1>
	  <h1>Venue:${req.body.venue}</h1>
	  <h1>${req.body.description}</h1>`,
	  attachments: [
	    {
	      content: encoded,
	      filename: `${req.file.originalname}`,
	      type: `${req.file.mimetype}`,
	      disposition: "attachment"
	    }
  ]
		};
	sgMail.send(msg);
	res.redirect("/admin/students");

});

/////////////GETTING ASSIGNMENT PAGE////////////////////////////
app.get('/admin/assignment',checkAuth,(req,res)=>{
	res.render('Assignment');
});

/////////ROUTE TO POST THE DETAILS REGARDING ASSIGNMENT AND SEND THEM TO STUDENTS VIA EMAIL/////////
app.post('/admin/assignment',upload.single('avatar'),(req,res)=>{
	console.log(req.file);
	const encoded = req.file.buffer.toString('base64');
	const msg = {
	  to: 'vermajatin4621@gmail.com',
	  from: 'jatinverma4621@gmail.com',
	  subject: `Assigment`,
	  text: `${req.body.subject}`,
	  html: `

	  <h1>Subject:${req.body.subject}</h1>
	  <h1>Dead Line:${req.body.date}</h1>`,
	  attachments: [
	    {
	      content: encoded,
	      filename: `${req.file.originalname}`,
	      type: `${req.file.mimetype}`,
	      disposition: "attachment"
	    }
  ]
		};
	sgMail.send(msg);
	res.redirect("/admin/students");
})
var tokens=[];

//////LOGIN ROUTE FOR ADMIN///////////////

app.get('/admin',(req,res)=>{
	res.render('LoginAdmin',{erru:"",errp:""});
});

//////////AUTHORIZATION AS WELL AS JWT GENERATION///////////
app.post('/admin/login',(req,res)=>{
	Admin.findOne({username:req.body.id},(function(err,result){
		if(!result)
			res.render('LoginAdmin',{erru:"Username not found",errp:""});
		else if(!passwordHash.verify(req.body.password,result.password))
			res.render('LoginAdmin',{erru:"",errp:"Incorrect Password"});
		else 
			{	const user=result.username;
				const token = jwt.sign({ user }, jwtKey, {
				algorithm: "HS256",
				})
				console.log("token:", token);
				tokens.push(passwordHash.generate(token.toString()));

					res.cookie("token", token);
					res.render('Main');
			}
	}))
});

///////////ROUTE FOR ADMIN TO LOGOUT////////////////////
app.get('/logout',checkAuth,(req,res)=>{
	var tok=req.cookies.token;
  tokens= tokens.filter(function(term){
  	return passwordHash.verify(tok,term)!=true;
  });
  console.log(tokens);
	res.redirect('/');
});

/* MIDDLEWARE TO CHECK FOR ADMIN AUTHENTICATION */

function checkAuth(req,res,next){
	const token = req.cookies.token;
	var flag=0;
	console.log(tokens);
	tokens.map(to=>{
		if(passwordHash.verify(token,to));
		flag=1;
	});

	// if the cookie is not set, return an unauthorized error
	if (!token) {
		return res.status(401).end()
	}
	else if(!flag)
		res.redirect('/');
	else{
		var payload
		try {
			// Parse the JWT string and store the result in `payload`.
			// Note that we are passing the key in this method as well. This method will throw an error
			// if the token is invalid (if it has expired according to the expiry time we set on sign in),
			// or if the signature does not match
			payload = jwt.verify(token, jwtKey);

		} catch (e) {
			if (e instanceof jwt.JsonWebTokenError) {
				// if the error thrown is because the JWT is unauthorized, return a 401 error
				return res.status(401).end()
			}
			// otherwise, return a bad request error
			return res.status(400).end()
			}
			console.log(payload);
			next();
		}
	}

/*MIDDLEWARE TO CHECK FOR USER AUTHENTICATION*/


	function UsercheckAuth(req,res,next){
	const token = req.cookies.token;
	var flag=0;
	console.log(tokens);
	UserTokens.map(to=>{
		if(passwordHash.verify(token,to));
		flag=1;
	});

	// if the cookie is not set, return an unauthorized error
	if (!token) {
		return res.redirect('/');
	}
	else if(!flag)
		res.redirect('/');
	else{
		var payload
		try {
			// Parse the JWT string and store the result in `payload`.
			// Note that we are passing the key in this method as well. This method will throw an error
			// if the token is invalid (if it has expired according to the expiry time we set on sign in),
			// or if the signature does not match
			payload = jwt.verify(token, jwtKey);

		} catch (e) {
			if (e instanceof jwt.JsonWebTokenError) {
				// if the error thrown is because the JWT is unauthorized, return a 401 error
				return res.status(401).end()
			}
			// otherwise, return a bad request error
			return res.status(400).end()
			}
			console.log(payload);
			next();
		}
	}


////////////////////////////////USER ROUTES/////////////////////////////////////////////////////
UserTokens=[];
///////////USER LOGIN ROUTE///////////////////////////////
app.get('/user',(req,res)=>{
	res.render('UserLogin',{erru:""});
});
var uid;
var curr;
var lap;

////////////////////CHECKING AUTHORIZATION//////////////////////////////
app.post('/user',(req,res)=>{
	Student.findOne({_id:req.body.id},(function(err,result){
		if(!result)
			res.render('UserLogin',{erru:"Student not found"});
		else 
			{	uid=result._id;
				curr=result;
				lap=result;
				const user=result._id;
				const token = jwt.sign({ user }, jwtKey, {
				algorithm: "HS256",
				})
				console.log("token:", token);
				UserTokens.push(passwordHash.generate(token.toString()));

	// set the cookie as the token string, with a similar max age as the token
	// here, the max age is in milliseconds, so we multiply by 1000
					res.cookie("token", token);
					res.render('MainUser');
			}
	}));
});

//////////////////////////ROUTE TO GET PERSONAL DETAILS OF USER/////////////
app.get('/user/info/',UsercheckAuth,(req,res)=>{
	Student.findOne({_id:uid},function(err,result){
		res.render('ShowInfo',{data:result});
	})
});

///////////////ROUTE TO GET MARKS OF USER//////////////////////
app.get('/user/marks',UsercheckAuth,(req,res)=>{
	res.render('UserMarks');
});

app.post('/user/marks',UsercheckAuth,(req,res)=>{
	var ac,pr;
	
	lap.total.map(rec=>{
		if(rec.sem==req.body.sem)
		{
			rec.marks_sem.map(r=>{
				if(r.term==req.body.ms)
				{
					ac=r.m_written;
					pr=r.m_practical;
				}
			});
		}
	});
	if(ac!==undefined)
	res.render('UserM',{ac:ac,pr:pr});
	else
		res.redirect('/user/marks');
});

///////////ROUTE FOR USER TO GET LOGGED OUT OF THE WEBSITE///////////////////

app.get('/Userlogout',UsercheckAuth,(req,res)=>{
	var tok=req.cookies.token;
  UserTokens= UserTokens.filter(function(term){
  	return passwordHash.verify(tok,term)!=true;
  });
	res.redirect('/');
})



app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0' );
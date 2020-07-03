import React,{Component} from 'react';

class Form extends Component{
	constructor(props){
		super(props);
		this.state={username:" "};
		this.handleChange=this.handleChange.bind(this);
		this.handleSubmit=this.handleSubmit.bind(this);
	}

	render(){
		handleSubmit(evt){
			evt.preventDefault();
			alert(`You typed : ${this.state.username}`);
			this.setState({username:" "});
		}
		handleChange(evt){
			this.setState({evt.target.value});
		}
		return(

			<div>
				<form onSubmit={this.handleSubmit}>
					<input type="text" value={this.state.username} onChange={handleChange}/> 


				</form>

			</div>
			)
	}
}

export default Form;
import React, { Component } from 'react';
import firebase from 'firebase';
import logo from './logo.svg';
import './App.css';


  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyC96w7aqJiAEOScUVqlqUnWqvv5h9EJNXU",
    authDomain: "base-de-datos-u4.firebaseapp.com",
    databaseURL: "https://base-de-datos-u4.firebaseio.com",
    projectId: "base-de-datos-u4",
    storageBucket: "base-de-datos-u4.appspot.com",
    messagingSenderId: "743376369390"
  };
  firebase.initializeApp(config);

class App extends Component {
  constructor(props){
    super(props);
    this.userOn = this.userOn.bind(this)
    this.userOff = this.userOff.bind(this)
    this.state = {
      user: null
    }
  }

  handleAuth(){
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) =>{
        firebase.database().ref('Usuarios/' + result.user.displayName).update({
          username: result.user.displayName,
          email: result.user.email,
          foto: result.user.photoURL
        })

      })
      //En caso de que ocurra un error lo imprimirá en consola
      .catch(error => console.error(`Error : ${error.code}: ${error.message}`))
  }

  handleLogout(){
    //Hacemos que se elimine la sesión del usuario
    firebase.auth().signOut()
      .then(() =>{ //si todo ocurre correctamente
        console.log('te has deslogeado')
      })
      //Si ocurrió un error muestra el error en cosola
      .catch(error => console.error(`Error : ${error.code}: ${error.message}`))
  }

  componentDidMount(){
    firebase.auth().onAuthStateChanged(user => {
      this.setState({ user })
    })
  }

  render() {
    return (
      <div className="center">
        <div>
          <Login
            user={this.state.user}
            handleLogout={this.handleLogout.bind(this)}
            handleAuth={this.handleAuth.bind(this)}
          />
        </div>
          {this.state.user ? this.userOn() : this.userOff() }
      </div>
    )
  }

  userOn(){   // Función que se ejecutará si existe user
    return (
      <div className="row">
          <h6 className="white-text"
            style={{fontFamily: 'Baloo', paddingTop : "30px"}}
          >
            Sube tus imagenes
          </h6>
          <FileUpload user={this.state.user} />
          <DocumentsList user = {this.state.user} />
      </div>
      )
  }

  userOff(){ //Función que se ejecuta sino existe el usuario
    return (
      <h5 className="white-text"   //Etiqueta contenedora
        style={{fontFamily: 'Baloo', paddingTop : "30px"}}
      >
        Necesitas loguearte
      </h5>
      )
  }
}

class Login extends Component {
  render() {
    return(
      <div>
        {this.props.user ? this.renderUserData() : this.renderLoginButton()}
      </div>
    )
  }

  renderLoginButton(){
    return(
      <div style ={{fontFamily: ''}}>
        <img width={80} height={80} src={logo} alt=""/>
        <h3 className="white-text">Bienvenido</h3>
        <button className="waves-effect waves-light btn red"
          onClick={this.props.handleAuth}>Login</button>
      </div>
    )
  }

  renderUserData(){
    return(
      <div className= "white-text" style={{fontFamily: ''}}>
        <img className="circle" width={80} height={80} src={this.props.user.photoURL}
          alt="" />
        <h4>{this.props.user.displayName}</h4>
        <h6>{this.props.user.email}</h6>
        <button className="waves-effect waves-light btn red"
          onClick={this.props.handleLogout}>Salir</button>
      </div>
    )
  }
}

//Clase para el camponente de carga de archivo
class FileUpload extends Component {
  constructor() {
    super()
    this.state = {
      unploadValue:0
    }
  }

  render(){
    return(
      <div>
        <input type="file" onChange={this.handleOnChange.bind(this)} />
        <div className="row">
          <div className="progress col l4 offset-l4 m4 offset-m4 s8 offset-s2" >
            <div className="determinate"
              style={{width : this.state.unploadValue + "%"}}>
            </div>
          </div>
        </div>
        <h6 className="white-text" style={{fontFamily: ''}}>
          {this.state.unploadValue} % {this.state.message}</h6>
      </div>
    )
  }

  handleOnChange(event){
    let file = event.target.files[0]
    let storageRef = firebase.storage().ref(
      'Documentos'+this.props.user.displayName+'/'+file.name
    )
    let task = storageRef.put(file)
    task.on('state_changed', (snapshot) =>{
      let percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      this.setState({ unploadValue: percentage})
    }, (error) => {
      this.setState({message: 'Error: $(error.message)'})
    }, () => {
      firebase.database().ref('Documentos/'+this.props.user.displayName).push({
        titulo: file.name,
        downloadURL: task.snapshot.downloadURL
      })
    this.setState({
      message: "Archivo subido"
    })

    })
  }
}
//Componente para crear la estructura de la lista
class DocumentsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      documents : []
    }
  }

  componentDidMount(){
    let t = this
    var docRef = firebase.database().ref('Documentos/'+t.props.user.displayName)
    docRef.on('value', function(snapshot) {
      let temp = []
      for (let doc in snapshot.val()){
        temp.push(snapshot.val()[doc])
      }
    t.setState({documents : temp})
  });
  }

  render(){
    return(
      <div className="col l4 m4 s10 offset-l4 offset-m4 offset-s1">
        <ul className="collection">
        {
          this.state.documents.map((doc) => (
            <DocumentItem key={doc.downloadURL} doc={doc} />
          ))
        }
        </ul>
      </div>
    )
  }
}
//Clase para mostrar en lista los archivos que ha subido el usuario
class DocumentItem extends Component {
  render() {
    return(
      <li className = "collection-item avatar">
        <img src={this.props.doc.downloadURL} className="circle" alt="" />
        <span className="title">{this.props.doc.titulo}</span>
      </li>
    )
  }
}
export default App;

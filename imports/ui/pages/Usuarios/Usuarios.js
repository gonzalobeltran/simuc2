import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './Usuarios.html';
import './CreaUsuario.js';
import './EditaUsuario.js';

Template.Usuarios.onCreated(function() {
  Session.set('cargandoArchivo', '');
  Session.set('filtroUsuarios', '--');

  this.autorun( () => {
    let handle = Subs.subscribe('usuarios', Session.get('filtroUsuarios'));
    Session.set('ready', handle.ready());
  });
});

Template.Usuarios.helpers({
  //Retorna la lista de usuarios que pasan el filtro de búsqueda
  usuarios() {
    let rxp = new RegExp(Session.get('filtroUsuarios'), 'i');

    let usuarios = [];
    Meteor.users.find({$or: [
      {'profile.nombre': {$regex: rxp}},
      {'emails.0.address': {$regex: rxp}},
      {'profile.ocupacion': {$regex: rxp}},
      {'profile.instrumento': {$regex: rxp}},
      {'profile.amonestado': {$regex: rxp}}
    ]}, {sort: {'profile.nombre': 1}}).forEach(function(u) {
      let usuario = {
        _id: u._id,
        nombre: u.profile.nombre,
        ocupacion: u.profile.ocupacion,
        instrumento: u.profile.instrumento,
        email: u.emails[0].address,
        amonestado: u.profile.amonestado,
        reglamento: u.profile.reglamento
      }

      usuarios.push(usuario);
    });

    return usuarios;
  },
  esAdmin() {
    if (Roles.userIsInRole(this._id, 'admin')) return 'adminColor';
  },
  cargandoArchivo() {
    return Session.get('cargandoArchivo');
  },
  err() {
    return Session.get('err');
  },
});

Template.Usuarios.events({
  'click .js-creaUsuario'() {
    Modal.show('CreaUsuario', '');
  },
  'click .js-editaUsuario'() {
    Modal.show('EditaUsuario', this);
  },
  'change .uploadCSV'(event) {
    if (event.target.files[0].type != 'text/csv') return false;
    Session.set('cargandoArchivo', 'Cargando...');
    Papa.parse( event.target.files[0], {
      header: true,
      complete: function (results, file) {
        Meteor.call('creaUsuariosDesdeArchivo',results.data, (err, res) => {
          if (err){
            Session.set('cargandoArchivo', 'Error');
            console.log(err);}
          else
            Session.set('cargandoArchivo', 'OK!');
        });
      }
    });
  },
  'input #filtro'(event) {
    let filtro = event.target.value;
    if (filtro.length > 2) {
      Session.set('filtroUsuarios', filtro);
    } else {
      if (filtro == "*") Session.set('filtroUsuarios', '');
        else Session.set('filtroUsuarios', '--');
    }
  },
});

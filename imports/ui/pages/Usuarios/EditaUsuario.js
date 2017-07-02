import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './EditaUsuario.html';

Template.EditaUsuario.rendered = function(){
  $('#ocupacion').select2();
  $('#instrumento').select2();
  $('#nivel').select2();
  //Inicializa el selector de fecha para amonestación
  $('#amonestado').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    setDate: new Date(),
  });
}

Template.EditaUsuario.helpers({
  esOcupacion(ocupacion) {
    if (this.ocupacion == ocupacion ) return 'selected';
  },
  instrumentos() {
    return Session.get('actividades');
  },
  esInstrumento(instrumento) {
    if (_.contains(this.instrumento, instrumento)) return 'selected';
  },
  esNivel(nivel) {
    if (Roles.userIsInRole(this._id, nivel)) return 'btn-success';
    return 'btn-default';
  }
});

Template.EditaUsuario.events({
  'submit #usuarioForm'(event, template) {
    event.preventDefault();

    let nombre = event.target.nombre.value;
    let email = event.target.email.value;
    let ocupacion = event.target.ocupacion.value;
    let instrumento = _.pluck( _.filter(event.target.instrumento.options, (i) => {return i.selected}) , 'value');
    let amonestado = event.target.amonestado.value;

    Meteor.call('editaUsuario', this._id, nombre, email, ocupacion, instrumento, amonestado, this.reglamento);

    template.find("form").reset();
    Modal.hide();
  },
  'click .js-borraUsuario'(event, template) {
    Meteor.call('borraUsuario', this._id);

    template.find("form").reset();
    Modal.hide();
  },
  'click .js-flipUsuario'() {
    Meteor.call('roleFlip', this._id, 'usuario');
  },
  'click .js-flipAdmin'() {
    Meteor.call('roleFlip', this._id, 'admin');
  },
  'click .js-flipSuperadmin'() {
    Meteor.call('roleFlip', this._id, 'superadmin');
  },
});

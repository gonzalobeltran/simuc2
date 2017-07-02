import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './CreaUsuario.html';

Template.CreaUsuario.rendered = function(){
  $('#creaOcupacion').select2();
  $('#creaInstrumento').select2();
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

Template.CreaUsuario.helpers({
  instrumentos() {
    return Session.get('actividades');
  },
});

Template.CreaUsuario.events({
  'submit #creaUsuarioForm'(event, template) {
    event.preventDefault();

    let nombre = event.target.nombre.value;
    let email = event.target.email.value;
    let ocupacion = event.target.ocupacion.value;
    let instrumento = _.pluck( _.filter(event.target.instrumento.options, (i) => {return i.selected}) , 'value');
    let clave1 = event.target.clave1.value;
    let clave2 = event.target.clave2.value;

    if (clave1 != clave2) return false;

    Meteor.call('creaUsuario', nombre, email, clave1, ocupacion, instrumento);

    template.find("form").reset();
    Modal.hide();
  },
});

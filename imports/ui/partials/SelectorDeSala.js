import { Template } from 'meteor/templating';
import { Salas } from '/imports/api/collections/collections.js';

import './SelectorDeSala.html';

Template.SelectorDeSala.onCreated(function(){
  //Se suscribe a la lista de salas
  Subs.subscribe('salas');
});

Template.SelectorDeSala.helpers({
  salaActiva() {
    return Session.get('sala');
  },
  salas() { //Lista de salas
    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    if (!Session.get('sala')) Session.set('sala', salas[0]);
    return salas;
  },
  isSelected(sala) { //Marca la sala seleccionada
    if (sala == Session.get('sala')) return 'selected';
  },
});

Template.SelectorDeSala.events({
  'change .js-salaSelect'(event) { //Selector de sala
    Session.set('sala', event.target.value);
  },
});

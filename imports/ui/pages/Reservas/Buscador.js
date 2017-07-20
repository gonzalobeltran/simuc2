import { Reservas } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';
import { Camara } from '/imports/api/collections/collections.js';


import './Buscador.html';

Template.Buscador.onCreated(function() {
  if (Meteor.user()) {
    Session.set('actividad', 0); //El primer instrumento del usuario será la actividad por defecto
    let actividades = [];
    let index = 0;

    //Agrega los instrumentos del usuario al menú de actividades
    Meteor.user().profile.instrumento.forEach( (instrumento) => {
      let cuenta = Reservas.find({fechas: this.data.fecha, integrantes: Session.get('usuario'), actividad: instrumento}).count();
      //Solo puede reservar si no ha superado el máximo de reservas por día
      if (cuenta < Session.get('config').maxReservas) {
        actividades.push({
          index: index,
          menu: instrumento + ' - ' + Session.get('usuario'),
          actividad: instrumento,
          integrantes: [Session.get('usuario')],
        });
        index += 1;
      }
    });

    //Agrega los grupos de cámara del usuario al menú de actividades
    Camara.find({integrantes: Session.get('usuario')}).forEach((grupo) => {
      let cuenta = Reservas.find({integrantes: grupo.integrantes,
            fechas: {$gte: moment(this.data.fecha).weekday(0).format('YYYY-MM-DD'), $lte: moment(this.data.fecha).weekday(6).format('YYYY-MM-DD')}}).count();
      //Solo puede reservar si no ha superado el máximo de reservas en la semana
      if (cuenta < Session.get('config').maxCamaraPorSemana) {
        actividades.push({
          index: index,
          menu: 'Camara - ' + apellidos(grupo.integrantes),
          actividad: 'Música de Cámara',
          integrantes: grupo.integrantes,
        });
        index+=1;
      }
    });

    Session.set('menuActividades', actividades);
  }

  this.autorun( () => {
    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    //Se suscribe a las reservas hechas en el módulo seleccionado
    let handle = Subs.subscribe('reservasModulo', this.data.fecha, this.data.modulo);
    Session.set('ready', handle.ready());
  });
});

Template.Buscador.helpers({
  actividades() {
    return Session.get('menuActividades');
  },
  salasConPrioridad() { //Lista de salas disponibles
    let actividades = Session.get('menuActividades');
    let menu = actividades[Session.get('actividad')];

    //Busca las salas que tengan reservas con prioridad
    let salasConReserva = Reservas.find({fechas: this.fecha, modulos: this.modulo, prioridad: {$gte: 2}}).map( (d) => {return d.sala} );
    //Busca las salas en las que la actividad tenga prioridad y no estén reservadas
    let salasDisponibles = Salas.find({prioridad: menu.actividad, nombre: {$nin: salasConReserva}}, {sort: {orden: 1}}).map( (d) => {return d.nombre} );

    return salasDisponibles;
  },
  salasSinPrioridad() { //Lista de salas disponibles
    let actividades = Session.get('menuActividades');
    let menu = actividades[Session.get('actividad')];

    //Busca las salas que tengan reservas de cualquier tipo
    let salasConReserva = Reservas.find({fechas: this.fecha, modulos: this.modulo}).map( (d) => {return d.sala} );
    //Busca las salas en que la actividad sea aceptada pero no prioridad, y no estén reservadas
    let salasDisponibles = Salas.find({acepta: menu.actividad, prioridad: {$ne: menu.actividad}, nombre: {$nin: salasConReserva}}, {sort: {orden: 1}}).map( (d) => {return d.nombre} );

    return salasDisponibles;
  },
});

Template.Buscador.events({
  'change .js-actividad'(event) {
    Session.set('actividad', event.target.value);
  },
  'submit #miReservaForm'(event, template) {
    event.preventDefault();

    let sala = event.target.sala.value;
    let actividades = Session.get('menuActividades');
    let menu = actividades[Session.get('actividad')];
    let actividad = menu.actividad;
    let integrantes = menu.integrantes;

    Meteor.call('nuevaReservaUsuario', sala, this.fecha, this.modulo, actividad, integrantes, (err, res) => {
      if (err) Session.set('err', err.reason);
    });

    Modal.hide();
  }
});

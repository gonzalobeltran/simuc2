import { Meteor } from 'meteor/meteor';

import { Reservas } from '/imports/api/collections/collections.js';
import { Calendario } from '/imports/api/collections/collections.js';

import './Reservas.html';
import './EliminarReserva.js';
import './Buscador.js';

Template.Reservas.onCreated(function() {
  this.autorun( () => {
    let semana = Session.get('semanaDesdeHoy');
    document.documentElement.style.setProperty("--colNum", 1 + 6 * !Session.get('verDia'));
    document.documentElement.style.setProperty('--primFila', '30px');

    if (Meteor.user()) {
      //Revisa si el usuario está amonestado
      Meteor.call('revisaAmonestacion');

      let amonestado = Meteor.user().profile.amonestado;
      Session.set('amonestado', amonestado);

      //Se suscribe a los grupos de música de cámara (para ver si el usuario puede reservar salas grandes)
      Subs.subscribe('camaraUsuario', Session.get('usuario'));

      //Se suscribe a las reservas del usuario en la semana activa
      let handle = Subs.subscribe('reservasUsuario', Session.get('usuario'), semana[0], semana[6]);
      Session.set('ready', handle.ready());
    }

  });
});

Template.Reservas.helpers({
  tablaReservas() { //Retorna la tabla con todas las reservas
    let semana = Session.get('semanaDesdeHoy');
    let modulos = Session.get('modulos');

    let celdas = [];
    let ini = 0;
    let fin = 6;
    let verDia = Session.get('verDia');

    if (verDia) {
      ini = fin = Session.get('diaReserva');
    }

    for (let fila = 0; fila < 9; fila += 1) { //9 módulos
      celdas[fila] = [];
      for (let columna = ini; columna <= fin; columna += 1) { //7 días

        let colCelda = verDia ? 0 : columna;
        //Módulo vacío
        celdas[fila][colCelda] = [{
          sala: (modulos[fila] == 'almuerzo') ? 'A' : '-',
          fecha: semana[columna],
          modulo: fila,
          nombreModulo: modulos[fila],
          dias: [{fecha: semana[columna], modulo: fila}]
        }];

        let reservas = Reservas.find({dias: {$elemMatch: {fecha: semana[columna], modulo: fila} }, integrantes: Session.get('usuario')}).fetch();

        for (let i in reservas) {
          let dia = Calendario.findOne({sala: reservas[i].sala, fecha: semana[columna], modulo: fila});
          if (dia) reservas[i].cuenta = dia.cuenta;
          reservas[i].fecha = semana[columna];
          reservas[i].nombreModulo = modulos[fila];
          celdas[fila][colCelda][i] = reservas[i];
        }

      }
    }

    return celdas;
  },
  diasSemana() { //Retorna los días de la semana
    if (Session.get('verDia')) return [Session.get('diasSemanaDesdeHoy')[Session.get('diaReserva')]];
    return Session.get('diasSemanaDesdeHoy');
  },
  modulos() { //Retorna los nombres y horarios de los módulos
    return Session.get('textoModulo');
  },
  repite() { //Agrega un pin si es una reserva con repetición
    if (this.dias[0].fecha != this.dias[this.dias.length - 1].fecha) return true;
    return false;
  },
  accion() { //Cambia la acción del click dependiendo de la fecha y el módulo
    //No puede reservar el mismo día, en el módulo de almuerzo y los fines de semana
    if (this.fecha <= Session.get('hoy') || this.nombreModulo == 'almuerzo' || moment(this.fecha).weekday() > 4) return 'desactivado';

    //No puede eliminar una reserva recurrente
    if (this.dias[0].fecha != this.dias[this.dias.length - 1].fecha) return 'desactivado';

    return 'js-editaModulo';
  },
  hayOtra() {
    if (this.cuenta > 2 && this.prioridad == 1) return 'masDeUna';
    if (this.cuenta == 3 && this.prioridad == 2) return 'quitado';
    if (this.cuenta > 3) return 'masDeUna';
  },
  amonestado() {
    return Session.get('amonestado');
  },
  hayMensaje() {
    config = Session.get('config');
    if (config) return config.mensaje;
  },
  verDia() {
    return Session.get('verDia');
  },
  tipoTabla() {
    if (Session.get('verDia')) return 'gtableUnDia'
    return 'gtable';
  },
  textoVerDia() {
    if (Session.get('verDia')) return '1 día';
    return '7 días';
  }
});

Template.Reservas.events({
  'click .js-editaModulo'() { //Muestra el modal para editar reservas
    if (this.sala == '-') {
      Modal.show('Buscador', this);
    } else {
      Modal.show('EliminarReserva', this);
    }
  },
  'click .js-diaAnt'() { //Retrocede la fecha una semana
    let dia = Session.get('diaReserva') - 1;
    if (dia < 0) dia = 0;
    Session.set('diaReserva', dia);
  },
  'click .js-diaSig'() { //Adelanta la fecha una semana
    let dia = Session.get('diaReserva') + 1;
    if (dia > 6) dia = 6;
    Session.set('diaReserva', dia);
  },
  'click .js-verDiaFlip'() {
    let verDia = Session.get('verDia');
    Session.set('verDia', !verDia);
  }
});

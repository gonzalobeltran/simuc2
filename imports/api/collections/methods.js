import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Salas } from './collections.js';
import { Reservas } from './collections.js';
import { Camara } from './collections.js';
import { Config } from './collections.js';
import { Log } from './collections.js';

// Lanza un error si el usuario no tiene rol requerido
var checkRole = function(t, role) {
  if (! Roles.userIsInRole(t.userId, role))
    throw new Meteor.Error('Error','No autorizado');
}

//Retorna un array con todas las fechas entre dos fechas dadas
var fechasHasta = function(inicio, fin, dias) {
  var fechas = [];
  var f = inicio;
  var i = 0;

  do {
    if ( _.contains(dias, moment(f).weekday()) ) fechas.push(f);
    i += 1;
    f = moment(inicio).add( i , 'days').format('YYYY-MM-DD');
  } while (f <= fin);

  return fechas;
}

Meteor.methods({

//------------Funciones de Reservas

  'nuevaReservaUsuario'(sala, fecha, modulo, actividad, integrantes) {
    checkRole(this, 'usuario');

    check(sala, String);
    check(fecha, String);
    check(modulo, String);
    check(actividad, String);
    check(integrantes, [String]);

    if (!actividad) {
      throw new Meteor.Error('Error al reservar','Reserva debe describir una actividad');
    }

    if (integrantes.length) {
      let duplicado = Reservas.find({fechas: fecha, modulos: modulo, integrantes: integrantes}).count();
      if (duplicado) {
        throw new Meteor.Error('Error al reservar','Usuario ya tiene reservada otra sala en ese módulo');
      }
    }

    //Verifica que no haya otra reserva en ese módulo
    let hayOtra = Reservas.find({sala: sala, fechas: fecha, modulos: modulo, prioridad: {$gte: prioridad}}).count();
    if (hayOtra) {
      throw new Meteor.Error('Error al reservar','Ya existe una reserva en ese módulo');
    }

    let prioridad = 1;
    if ( Salas.find({nombre: sala, prioridad: actividad}).count() ) {
      prioridad = 2;
    }
    
    Reservas.insert({sala: sala, fechas: [fecha], modulos: [modulo], prioridad: prioridad, actividad: actividad, integrantes: integrantes});
  },

  'nuevaReservaAdmin'(sala, fechas, modulos, prioridad, actividad, integrantes, repiteHasta, dias) {
    checkRole(this, 'admin');

    check(sala, String);
    check(fechas, [String]);
    check(modulos, [String]);
    check(prioridad, Number);
    check(actividad, String);
    check(integrantes, [String]);
    check(repiteHasta, String);
    check(dias, [Number]);

    if (!sala || !fechas.length || !modulos.length || !actividad || !repiteHasta || !dias) {
      throw new Meteor.Error('Error al reservar','Faltan datos para realizar la reserva');
    }

    let nuevasFechas = fechasHasta(fechas[0], repiteHasta, dias);

    Reservas.insert({sala: sala, fechas: nuevasFechas, modulos: modulos, prioridad: prioridad, actividad: actividad, integrantes: integrantes});


    let usuario = Meteor.users.find({_id: this.userId}).map((d) => {return d.profile.nombre})[0];
    Log.insert({sala: sala, fechas: nuevasFechas, modulos: modulos, accion: 'crea', actividad: actividad, usuario: usuario, timestamp: moment().format('YYYY-MM-DD HH:mm:ss')});
  },

  'modificaReserva'(id, actividad, integrantes, modulos, repiteHasta, dias) {
    checkRole(this, 'admin');

    check(id, String);
    check(actividad, String);
    check(integrantes, [String]);
    check(modulos, [String]);
    check(repiteHasta, String);
    check(dias, [Number]);

    if (!actividad || !modulos.length || !repiteHasta || !dias) {
      throw new Meteor.Error('Error al reservar','Faltan datos para modificar la reserva');
    }

    let old = Reservas.findOne({_id: id});
    let fechas = fechasHasta(old.fechas[0], repiteHasta, dias);

    Reservas.update({_id: id}, {$set: {actividad: actividad, integrantes: integrantes, fechas: fechas, modulos: modulos, timestamp: moment().format('YYYY-MM-DD HH:mm:ss')}});

    let usuario = Meteor.users.find({_id: this.userId}).map((d) => {return d.profile.nombre})[0];
    Log.insert({sala: old.sala, fechas: fechas, modulos: modulos, accion: 'modifica', vieja: old.actividad, nueva: actividad, usuario: usuario, timestamp: moment().format('YYYY-MM-DD HH:mm:ss')});
  },

  'eliminaReserva'(id) {
    checkRole(this, 'usuario');
    check(id, String);

    Reservas.remove({_id: id});
  },

  'eliminaEstaFecha'(id, fecha) {
    checkRole(this, 'admin');
    check(id, String);
    check(fecha, String);

    Reservas.update({_id: id}, {$pull: {fechas: fecha}});
  },

//------------Funciones de salas
  'listaSalas'() {
    var salas = [];
    Salas.find({}, {sort: {nombre: 1}}).forEach(function(u) {
      salas.push(u.nombre);
    });
    return salas;
  },

  'creaSala'(nombre, prioridad, acepta, orden) {
    checkRole(this, 'superadmin');
    check(nombre, String);
    check(prioridad, [String]);
    check(acepta, [String]);
    check(orden, String);

    const existe = Salas.find({nombre: nombre}).count();

    if (existe) {
      throw new Meteor.Error('Error al insertar', 'Ya existe una sala con ese nombre');
    }

    Salas.insert({nombre: nombre, prioridad: prioridad, acepta: acepta, orden: orden});
  },

  'editaSala'(id, nombre, prioridad, acepta, orden) {
    checkRole(this, 'superadmin');
    check(id, String);
    check(nombre, String);
    check(prioridad, [String]);
    check(acepta, [String]);
    check(orden, String);

    let salaOld = Salas.findOne({_id: id});

    //Si cambia el nombre de la sala, actualiza todas las reservas hechas en esa sala
    if (salaOld.nombre != nombre) {
      Reservas.update({sala: salaOld.nombre}, {$set: {sala: nombre}}, {multi: true});
    }

    Salas.update({_id: id}, {$set: {nombre: nombre, prioridad: prioridad, acepta: acepta, orden: orden}});
  },

  'borraSala'(id) {
    checkRole(this, 'superadmin');
    check(id, String);

    Salas.remove({_id: id});
  },

//------------Funciones de cámara

  'creaGrupo'(profesor, integrantes) {
    checkRole(this, 'admin');
    check(profesor, [String]);
    check(integrantes, [String]);

    Camara.insert({profesor: profesor, integrantes: integrantes});
  },

  'editaGrupo'(id, profesor, integrantes) {
    checkRole(this, 'admin');
    check(id, String);
    check(profesor, [String]);
    check(integrantes, [String]);

    Camara.update({_id: id}, {$set: {profesor: profesor, integrantes: integrantes}});
  },

  'borraGrupo'(id) {
    checkRole(this, 'admin');
    check(id, String);

    Camara.remove({_id: id});
  },


//------------Funciones de usuario
  'creaUsuario'(nombre, email, clave, ocupacion, instrumento) {
    checkRole(this, 'admin');
    check(nombre, String);
    check(email, String);
    check(clave, String);
    check(ocupacion, String);
    check(instrumento, [String]);

    if ( Meteor.users.findOne({'emails.0.address': email}) )
      throw new Meteor.Error('Error al crear usuario', 'Ya existe usuario con esa dirección de correo');

    //Saca el nombre de usuario del email
    let pos = email.indexOf('@');
    let username = email.slice(0, pos);

    let id = Accounts.createUser({
      email: email,
      username: username,
      password: clave,
      profile: {
        nombre: nombre,
        instrumento: instrumento,
        ocupacion: ocupacion,
        reglamento: false,
      }
    });

    if (!this.isSimulation) {
      if (ocupacion == 'Alumno' || ocupacion == 'Profesor')
        Roles.addUsersToRoles(id, ['usuario']);
    }

  },

  'creaUsuariosDesdeArchivo'(data) {
    checkRole(this, 'admin');

    for (let d in data) {
      let u = data[d];
      if (!Meteor.users.findOne({'emails.0.address': u.email}) ) {
        Meteor.call('creaUsuario',u.nombre, u.email, u.clave, u.ocupacion, u.instrumento);
      }
    }
  },

  'listaUsuarios'() {
    return Meteor.users.find({}, {sort: {'profile.nombre':1}}).map((d) => {return d.profile.nombre});
  },

  'editaUsuario'(id, nombre, email, ocupacion, instrumento, amonestado, reglamento) {
    checkRole(this, 'admin');
    check(id, String);
    check(nombre, String);
    check(email, String);
    check(ocupacion, String);
    check(instrumento, [String]);
    check(amonestado, String);
    check(reglamento, Boolean);

    //Saca el nombre de usuario del email
    let pos = email.indexOf('@');
    let username = email.slice(0, pos);

    Meteor.users.update({_id: id}, {$set: {
      'emails.0.address': email,
      username: username,
      profile: {
        nombre: nombre,
        instrumento: instrumento,
        ocupacion: ocupacion,
        reglamento: reglamento,
      }
    }});

    //Guarda la fecha de amonestación, o borra el campo si no está amonestado
    if (!amonestado || amonestado == moment().format('YYYY-MM-DD')) {
      Meteor.users.update(
        {_id: id},
        {$unset: {'profile.amonestado': ''}}
      );
    } else {
      Meteor.users.update(
        {_id: id},
        {$set: {'profile.amonestado': amonestado}}
      );
    }

    if (!this.isSimulation) {
      if (ocupacion == 'Alumno' || ocupacion == 'Profesor')
        Roles.addUsersToRoles(id, ['usuario']);

      if (ocupacion == 'Auxiliar' || ocupacion == 'Administrativo')
        Roles.removeUsersFromRoles(id, ['usuario']);
    }

  },

  'borraUsuario'(id) {
    checkRole(this, 'admin');
    check(id, String);

    if (id == this.userId) return(false);

    Meteor.users.remove({_id: id});
  },

  'roleFlip'(id, role) {
    checkRole(this, 'superadmin');

    if (id == this.userId)
      throw new Meteor.Error('Error al cambiar rol', 'No puede cambiarse el rol a sí mismo');

    if (Roles.userIsInRole(id, role))
      Roles.removeUsersFromRoles(id, [role]);
    else
      Roles.addUsersToRoles(id, [role]);
  },

//------------Funciones de reglamento

  'aceptaReglamento'() {
    Meteor.users.update(this.userId, {$set: {'profile.reglamento': true}});
  },

  'resetReglamento'() {
    Meteor.users.update({}, {$set: {'profile.reglamento': false}}, {multi:true});
  },

//------------Funciones de config
  'cambiaConfig'(doc) {
    checkRole(this, 'admin');


    Config.update({}, {$set: doc});
  },

//------------Funciones para ver si se autoriza un usuario para reservar
  'fechaServidor'(fecha) {

    let res = {
      c: fecha,
      s: moment().format('YYYY-MM-DD')
    }

    return res;
  },

  'revisaAmonestacion'() {
    let usuario = Meteor.users.findOne(this.userId);
    if (moment().format('YYYY-MM-DD') >= usuario.profile.amonestado)
      Meteor.users.update(this.userId, {$unset: {'profile.amonestado': ''}});
  },

});

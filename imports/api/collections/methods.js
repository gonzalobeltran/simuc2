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
var fechasHasta = function(inicio, fin) {
  var fechas = [];
  var f = inicio;
  var fin = moment(fin).format('YYYY-MM-DD');
  var i = 0;

  do {
    fechas.push(f);
    i += 1;
    f = moment(inicio).add( i , 'weeks').format('YYYY-MM-DD');
  } while (f <= fin);

  return fechas;
}

Meteor.methods({

//------------Funciones de Reservas

  'nuevaReservaUsuario'(sala, fecha, modulo, prioridad, actividad, integrantes) {
    checkRole(this, 'usuario');

    check(sala, String);
    check(fecha, String);
    check(modulo, String);
    check(prioridad, Number);
    check(actividad, String);
    check(integrantes, [String]);

    if (!actividad) {
      throw new Meteor.Error('Error al reservar','Reserva debe describir una actividad');
    }

    if (integrantes.length) {
      let duplicado = Reservas.find({fecha: fecha, modulo: modulo, integrantes: integrantes}).count();
      if (duplicado) {
        throw new Meteor.Error('Error al reservar','Usuario ya tiene reservada otra sala en ese módulo');
      }
    }

    //Verifica que no haya otra reserva en ese módulo
    let hayOtra = Reservas.find({sala: sala, fecha: fecha, modulo: modulo, prioridad: {$gte: prioridad}}).count();
    if (hayOtra) {
      throw new Meteor.Error('Error al reservar','Ya existe una reserva en ese módulo');
    }

    Reservas.insert({sala: sala, fecha: [fecha], modulo: modulo, prioridad: prioridad, actividad: actividad, integrantes: integrantes, repiteHasta: fecha,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss')});
  },

  'nuevaReservaAdmin'(sala, fecha, modulos, prioridad, actividad, integrantes, repiteHasta) {
    checkRole(this, 'admin');

    check(sala, String);
    check(fecha, [String]);
    check(modulos, [String]);
    check(prioridad, Number);
    check(actividad, String);
    check(integrantes, [String]);
    check(repiteHasta, String);

    if (!sala || !fecha.length || !modulos.length || !actividad || !repiteHasta) {
      throw new Meteor.Error('Error al reservar','Faltan datos para realizar la reserva');
    }

    let fechas = fechasHasta(fecha[0], repiteHasta);

    Reservas.insert({sala: sala, fecha: fechas, modulo: modulos, prioridad: prioridad, actividad: actividad, integrantes: integrantes, timestamp: moment().format('YYYY-MM-DD HH:mm:ss')});

    //Log.insert({sala: sala, fecha: fecha, modulo: modulo, nueva: actividad, timestamp: moment().format('YYYY-MM-DD HH:mm:ss')});
  },

  'modificaReserva'(id, actividad, integrantes, modulos, repiteHasta) {
    checkRole(this, 'admin');

    check(id, String);
    check(actividad, String);
    check(integrantes, [String]);
    check(modulos, [String]);
    check(repiteHasta, String);

    if (!actividad || !modulos.length || !repiteHasta) {
      throw new Meteor.Error('Error al reservar','Faltan datos para modificar la reserva');
    }

    let old = Reservas.find({_id: id}).fetch();
    let fechas = fechasHasta(old[0].fecha[0], repiteHasta);

    Reservas.update({_id: id}, {$set: {actividad: actividad, integrantes: integrantes, fecha: fechas, modulo: modulos, timestamp: moment().format('YYYY-MM-DD HH:mm:ss')}});

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

    Reservas.update({_id: id}, {$pull: {fecha: fecha}});
  },

//------------Funciones de salas
  'listaSalas'() {
    var salas = [];
    Salas.find({}, {sort: {nombre: 1}}).forEach(function(u) {
      salas.push(u.nombre);
    });
    return salas;
  },

  'creaSala'(nombre, prioridad, acepta) {
    checkRole(this, 'superadmin');
    check(nombre, String);
    check(prioridad, [String]);
    check(acepta, [String]);

    const existe = Salas.find({nombre: nombre}).count();

    if (existe) {
      throw new Meteor.Error('Error al insertar', 'Ya existe una sala con ese nombre');
    }

    Salas.insert({nombre: nombre, prioridad: prioridad, acepta: acepta});
  },

  'editaSala'(id, nombre, prioridad, acepta) {
    checkRole(this, 'superadmin');
    check(id, String);
    check(nombre, String);
    check(prioridad, [String]);
    check(acepta, [String]);

    let salaOld = Salas.findOne({_id: id});

    //Si cambia el nombre de la sala, actualiza todas las reservas hechas en esa sala
    if (salaOld.nombre != nombre) {
      Reservas.update({sala: salaOld.nombre}, {$set: {sala: nombre}}, {multi: true});
    }

    Salas.update({_id: id}, {$set: {nombre: nombre, prioridad: prioridad, acepta: acepta}});
  },

  'borraSala'(id) {
    checkRole(this, 'superadmin');
    check(id, String);

    Salas.remove({_id: id});
  },

//------------Funciones de cámara

  'creaGrupo'(grupo) {
    checkRole(this, 'admin');
    Camara.insert(grupo);
  },

  'editaGrupo'(grupo) {
    checkRole(this, 'admin');

    Camara.update({_id: grupo._id}, {$set: {
      profesor: grupo.profesor,
      integrantes: grupo.integrantes
    }});
  },

  'borraGrupo'(grupo) {
    checkRole(this, 'admin');

    Camara.remove({_id: grupo._id});
  },


//------------Funciones de usuario
  'creaUsuario'(usuario) {
    checkRole(this, 'admin');

    if ( Meteor.users.findOne({'emails.0.address': usuario.email}) )
      throw new Meteor.Error('Error al crear usuario', 'Ya existe usuario con esa dirección de correo');

    //Saca el nombre de usuario del email
    let pos = usuario.email.indexOf('@');
    let username = usuario.email.slice(0, pos);

    let id = Accounts.createUser({
      email: usuario.email,
      username: username,
      password: usuario.clave,
      profile: {
        nombre: usuario.nombre,
        instrumento: usuario.instrumento,
        ocupacion: usuario.ocupacion,
      }
    });

    if (!this.isSimulation) {
      if (usuario.ocupacion == 'Alumno' || usuario.ocupacion == 'Profesor')
        Roles.addUsersToRoles(id, ['usuario']);
    }

  },

  'creaUsuariosDesdeArchivo'(data) {
    checkRole(this, 'admin');

    for (let d in data) {
      let u = data[d];
      if (!Meteor.users.findOne({'emails.0.address': u.email}) ) {
        Meteor.call('creaUsuario',u);
      }
    }
  },

  'listaUsuarios'() {
    return Meteor.users.find({}, {sort: {'profile.nombre':1}}).map((d) => {return d.profile.nombre});
  },

  'editaUsuario'(usuario) {
    checkRole(this, 'admin');

    //Saca el nombre de usuario del email
    let pos = usuario.email.indexOf('@');
    let username = usuario.email.slice(0, pos);

    Meteor.users.update({_id: usuario._id}, {$set: {
      'emails.0.address': usuario.email,
      username: username,
      profile: {
        nombre: usuario.nombre,
        instrumento: usuario.instrumento,
        ocupacion: usuario.ocupacion,
        reglamento: usuario.reglamento
      }
    }});

    //Guarda la fecha de amonestación, o borra el campo si no está amonestado
    if (!usuario.amonestado || usuario.amonestado == moment().format('YYYY-MM-DD')) {
      Meteor.users.update(
        {_id: usuario._id},
        {$unset: {'profile.amonestado': ''}}
      );
    } else {
      Meteor.users.update(
        {_id: usuario._id},
        {$set: {'profile.amonestado': usuario.amonestado}}
      );
    }

    if (!this.isSimulation) {
      if (usuario.ocupacion == 'Alumno' || usuario.ocupacion == 'Profesor')
        Roles.addUsersToRoles(usuario._id, ['usuario']);

      if (usuario.ocupacion == 'Auxiliar' || usuario.ocupacion == 'Administrativo')
        Roles.removeUsersFromRoles(usuario._id, ['usuario']);
    }

  },

  'borraUsuario'(usuario) {
    checkRole(this, 'admin');

    if (usuario._id == this.userId) return(false);

    Meteor.users.remove({_id: usuario._id});
  },

  'roleSwitch'({id, role}) {
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
    checkRole(this, 'superadmin');

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

  'revisaAmonestacion'(fecha) {
    if (moment().format('YYYY-MM-DD') >= fecha)
    Meteor.users.update(this.userId, {$unset: {'profile.amonestado': ''}});
  },

});

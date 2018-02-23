import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Salas } from './collections.js';
import { Reservas } from './collections.js';
import { Cursos } from './collections.js';
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

//Guarda un registro de las acciones
var writeLog = function(userId, sala, accion, actividad, fechas, modulos) {
  let usuario = Meteor.users.find({_id: userId}).map((d) => {return d.profile.nombre})[0];
  let fecha = fechas[0];
  if (fechas.length > 1) fecha = 'desde ' + fechas[0] + ' hasta ' + fechas[fechas.length - 1];
  Log.insert({ts: moment().format('YYYY-MM-DD HH:mm:ss'), usuario: usuario, sala: sala, accion: accion, actividad: actividad, fechas: fecha, modulos: modulos});
}

apellidos = function(lista) {
  let res = [];

  for (let i in lista) {
    let palabras = lista[i].split(' ');
    let apellido = palabras[palabras.length - 1];
    res.push(apellido);
  }

  return res.join(', ');
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

    if (!sala || !fecha || !modulo || !actividad) {
      throw new Meteor.Error('Error al reservar','Se produjo un error al realizar la reserva');
    }

    if (integrantes.length) {
      let duplicado = Reservas.find({fechas: fecha, modulos: modulo, integrantes: integrantes}).count();
      if (duplicado) {
        throw new Meteor.Error('Error al reservar','Usuario ya tiene reservada otra sala en ese módulo');
      }
    }

    let prioridad = 1;
    if ( Salas.find({nombre: sala, prioridad: actividad}).count() ) {
      prioridad = 2;
    }

    //Verifica que no haya otra reserva en ese módulo
    let hayOtra = Reservas.find({sala: sala, fechas: fecha, modulos: modulo, prioridad: {$gte: prioridad}}).count();
    if (hayOtra) {
      throw new Meteor.Error('Error al reservar','Ya existe una reserva en ese módulo');
    }

    Reservas.insert({sala: sala, fechas: [fecha], modulos: [modulo], prioridad: prioridad, actividad: actividad, integrantes: integrantes});
    writeLog(this.userId, sala, 'Reserva', actividad, [fecha], modulo);
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
    writeLog(this.userId, sala, 'Reserva', actividad, nuevasFechas, modulos);
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
    writeLog(this.userId, old.sala, 'Modifica', actividad, fechas, modulos);
  },

  'eliminaReserva'(id) {
    checkRole(this, 'usuario');
    check(id, String);

    let old = Reservas.findOne({_id: id});
    Reservas.remove({_id: id});
    writeLog(this.userId, old.sala, 'Elimina reserva', old.actividad, old.fechas, old.modulos);
  },

  'eliminaEstaFecha'(id, fecha) {
    checkRole(this, 'admin');
    check(id, String);
    check(fecha, String);

    let old = Reservas.findOne({_id: id});
    Reservas.update({_id: id}, {$pull: {fechas: fecha}});
    writeLog(this.userId, old.sala, 'Elimina una fecha', old.actividad, [fecha], old.modulos);
  },

  'reservasSuperpuestas'(prioridad) {
    check(prioridad, Number);

    let hoy = moment().format('YYYY-MM-DD');
    return Reservas.aggregate([
      {$match: {fechas: {$gte: hoy}, prioridad: {$gte: prioridad}}},
      {$unwind: "$fechas"},
      {$unwind: "$modulos"},
      {
        $group: {
          _id: {sala: "$sala", fechas: "$fechas", modulos:"$modulos"},
          count: {$sum:1}
        }
      }, {
        $match: {
          count: {$gt:1},
        }
      }, {
        $sort: {
          '_id.fechas': 1,
          '_id.modulos': 1,
        }
      }
    ]).map((d) => {return d._id});
  },

//------------Funciones de cursos

'creaCurso'(periodo, ini, fin, nombre, profesor, sala, horario) {
  checkRole(this, 'admin');
  check(periodo, String);
  check(ini, String);
  check(fin, String);
  check(nombre, String);
  check(profesor, String);
  check(sala, String);
  check(horario, Array);

  let hash = Cursos.insert({periodo: periodo, ini: ini, fin: fin, nombre: nombre, profesor: profesor, sala: sala, horario: horario});

  let actividad = nombre + ' - ' + profesor;

  for (let m in horario) {
    let fechas = fechasHasta(ini, fin, horario[m].dias);

    Reservas.insert({sala: sala, fechas: fechas, modulos: horario[m].modulo, prioridad: 2, actividad: actividad, hash: hash});
  }

  writeLog(this.userId, sala, 'Crea curso', actividad, [periodo], '-');

},

'modificaCurso'(id, periodo, ini, fin, nombre, profesor, sala, horario) {
  checkRole(this, 'admin');
  check(periodo, String);
  check(ini, String);
  check(fin, String);
  check(id, String);
  check(nombre, String);
  check(profesor, String);
  check(sala, String);
  check(horario, Array);

  Cursos.update({_id: id},
    {$set: {periodo: periodo, ini:ini, fin:fin, nombre: nombre, profesor: profesor, sala: sala, horario: horario}});

  let actividad = nombre + ' - ' + profesor;

  Reservas.remove({hash: id});

  for (let m in horario) {
    let fechas = fechasHasta(ini, fin, horario[m].dias);

    Reservas.insert({sala: sala, fechas: fechas, modulos: horario[m].modulo, prioridad: 2, actividad: actividad, hash: id});
  }

  writeLog(this.userId, sala, 'Modifica curso', actividad, [periodo], '-');

},

'eliminaCurso'(id) {
  checkRole(this, 'admin');
  check(id, String);

  let old = Cursos.findOne({_id: id});
  writeLog(this.userId, old.sala, 'Elimina curso', old.nombre, [old.periodo], '-');

  Cursos.remove({_id: id});
  Reservas.remove({hash: id});
},

//------------Funciones de cámara

  'creaGrupo'(profesor, integrantes, sala, horario) {
    checkRole(this, 'admin');
    check(profesor, [String]);
    check(integrantes, [String]);
    check(sala, String);
    check(horario, Array);

    let hash = Camara.insert({profesor: profesor, integrantes: integrantes, sala: sala, horario: horario});

    let actividad = 'Cámara - ' + apellidos(profesor);

    let ini = moment().format('YYYY-MM-DD');
    let finSemestre = (moment().month()<6) ? '-06-30' : '-11-30';
    let fin = moment().year() + finSemestre;

    for (let m in horario) {
      let fechas = fechasHasta(ini, fin, horario[m].dias);

      Reservas.insert({sala: sala, fechas: fechas, modulos: horario[m].modulo, prioridad: 2, actividad: actividad, integrantes: profesor.concat(integrantes), hash: hash});
    }

  },

  'editaGrupo'(id, profesor, integrantes, sala, horario) {
    checkRole(this, 'admin');
    check(id, String);
    check(profesor, [String]);
    check(integrantes, [String]);
    check(sala, String);
    check(horario, Array);

    Camara.update({_id: id}, {$set: {profesor: profesor, integrantes: integrantes, sala: sala, horario: horario}});
    Reservas.remove({hash: id});

    let actividad = 'Cámara - ' + apellidos(profesor);

    let ini = moment().format('YYYY-MM-DD');
    let finSemestre = (moment().month()<6) ? '-06-30' : '-11-30';
    let fin = moment().year() + finSemestre;

    for (let m in horario) {
      let fechas = fechasHasta(ini, fin, horario[m].dias);

      Reservas.insert({sala: sala, fechas: fechas, modulos: horario[m].modulo, prioridad: 2, actividad: actividad, integrantes: profesor.concat(integrantes), hash: id});
    }

  },

  'borraGrupo'(id) {
    checkRole(this, 'admin');
    check(id, String);

    Camara.remove({_id: id});
    Reservas.remove({hash: id});
  },

  //------------Funciones de salas

    'creaSala'(nombre, prioridad, acepta, orden) {
      checkRole(this, 'superadmin');
      check(nombre, String);
      check(prioridad, [String]);
      check(acepta, [String]);
      check(orden, Number);

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
      check(orden, Number);

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

    'seleccionaSalas'(salas) {
      Meteor.users.update({_id: this.userId}, {$set: {'profile.salasSeleccionadas': salas}}
      );
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

    Config.update({mensaje: {$exists: true}}, {$set: doc});
  },

  'fechasPeriodo'(periodo, cual, fecha) {
    checkRole(this, 'admin');

    let cambia = {};
    cambia[cual] = fecha;

    Config.upsert({periodo: periodo}, {$set: cambia});
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

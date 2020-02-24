import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Salas } from './collections.js';
import { Reservas } from './collections.js';
import { Calendario } from './collections.js';
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
var listaDeDias = function(ini, fin, horario) {
  var fechas = [];
  var f = ini;
  var i = 0;

  do {
    if (horario[moment(f).weekday()]) {
      for (let n = 0; n < 9; n += 1) {
        if (horario[moment(f).weekday()] & Math.pow(2, n))
          fechas.push({ fecha: f, modulo: n });
      }
    }
    i += 1;
    f = moment(ini).add( i , 'days').format('YYYY-MM-DD');
  } while (f <= fin);

  return fechas;
}

//Guarda un registro de las acciones
var writeLog = function(userId, sala, accion, actividad, dias) {
  let usuario = Meteor.users.find({_id: userId}).map((d) => {return d.profile.nombre})[0];
  let fecha = dias[0].fecha;
  if (dias.length > 1) fecha = 'desde ' + dias[0].fecha + ' hasta ' + dias[dias.length - 1].fecha;
  Log.insert({ts: moment().format('YYYY-MM-DD HH:mm:ss'), usuario: usuario, sala: sala, accion: accion, actividad: actividad, fecha: fecha});
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

  'ReservaUsuario'(sala, actividad, integrantes, fecha, modulo) {
    checkRole(this, 'usuario');

    check(sala, String);
    check(actividad, String);
    check(integrantes, [String]);
    check(fecha, String);
    check(modulo, Number);

    if (!sala || !fecha || !actividad) {
      throw new Meteor.Error('Error al reservar','Se produjo un error al realizar la reserva');
    }

    let dia = [{fecha: fecha, modulo: modulo}];
    let horario = [0, 0, 0, 0, 0, 0, 0,];
    horario[moment(fecha).weekday()] = Math.pow(2, modulo);

    if (integrantes.length) {
      let duplicado = Reservas.find({dias: {$elemMatch: {fecha: fecha, modulo: modulo } }, integrantes: integrantes}).count();
      if (duplicado) {
        throw new Meteor.Error('Error al reservar','Usuario ya tiene reservada otra sala en ese módulo');
      }
    }

    let prioridad = Salas.find({nombre: sala, prioridad: actividad}).count() ? 2: 1;

    //Verifica que no haya otra reserva en ese módulo
    if (Reservas.find({sala: sala, dias: {$elemMatch: {fecha: fecha, modulo: modulo }}, prioridad: {$gte: prioridad}}).count()) {
      throw new Meteor.Error('Error al reservar','Ya existe una reserva en ese módulo');
    }

    let hash = Reservas.insert({sala: sala, actividad: actividad, integrantes: integrantes, prioridad: prioridad, dias: dia, horario: horario});
    Calendario.update({sala:sala, fecha: fecha, modulo: modulo}, {$push: {reservas: {hash: hash}}, $inc: {cuenta: prioridad} }, {upsert: true});
    writeLog(this.userId, sala, 'Reserva', actividad, dia);
  },

  'ReservaAdmin'(id, sala, actividad, integrantes, prioridad, ini, fin, horario, log) {
    checkRole(this, 'admin');

    check(sala, String);
    check(actividad, String);
    check(integrantes, [String]);
    check(prioridad, Number);
    check(ini, String);
    check(fin, String);
    check(horario, [Number]);
    check(log, Number);

    let accionLog = 'Reserva';
    if (id) {
      accionLog = 'Modifica reserva';
      Meteor.call('eliminaReserva', id, 0);
    }

    let hayHorario = horario.reduce((a,b) => a+b);

    if (!sala || !ini || !fin || !hayHorario || !actividad) {
      throw new Meteor.Error('Error al reservar','Faltan datos para realizar la reserva');
    }

    let dias = listaDeDias(ini, fin, horario);
    if (dias == '') return false;

    let hash = Reservas.insert({sala: sala, actividad: actividad, integrantes: integrantes, prioridad: prioridad, dias: dias, horario: horario});
    for (n in dias) {
      Calendario.update({sala:sala, fecha: dias[n].fecha, modulo: dias[n].modulo}, {$push: {reservas: {hash: hash}}, $inc: {cuenta: prioridad} }, {upsert: true});
    }

    if (log) writeLog(this.userId, sala, accionLog, actividad, dias);
    return (hash);
  },

  'eliminaReserva'(id, log) {
    checkRole(this, 'usuario');
    check(id, String);
    check(log, Number);

    if (!id) return false;
    let old = Reservas.findOne({_id: id});
    Reservas.remove({_id: id});
    Calendario.update({reservas: {hash: id} }, {$pull: {reservas: {hash: id}}, $inc: {cuenta: -old.prioridad}}, {multi: true});
    Calendario.remove({cuenta: 0});
    if (log) writeLog(this.userId, old.sala, 'Elimina reserva', old.actividad, old.dias);
  },

  'eliminaFechaSelect'(id, fecha) {
    checkRole(this, 'admin');
    check(id, String);
    check(fecha, String);

    let old = Reservas.findOne({_id: id});
    Reservas.update({_id: id}, { $pull: {dias: {fecha: fecha}} });
    Reservas.remove({dias: {$size: 0}});
    Calendario.update({fecha: fecha}, {$pull: {reservas: {hash: id}}, $inc: {cuenta: -old.prioridad}}, {multi: true});
    Calendario.remove({cuenta: 0});
    writeLog(this.userId, old.sala, 'Elimina una fecha', old.actividad, [{fecha: fecha}]);
  },

//------------Funciones de cámara

  'grupoCamara'(id, profesor, integrantes, sala, horario) {
    checkRole(this, 'admin');
    check(profesor, [String]);
    check(integrantes, [String]);
    check(sala, String);

    if (id) Meteor.call('borraGrupo', id);

    let hash = Camara.insert({profesor: profesor, integrantes: integrantes, sala: sala, horario: horario, idGrupo: ''});

    let hayHorario = horario.reduce((a,b) => a+b);
    if (!hayHorario) return false;

    let actividad = 'Cámara - ' + apellidos(profesor);

    let ini = moment().format('YYYY-MM-DD');
    let finSemestre = (moment().month()<6) ? '-06-30' : '-11-30';
    let fin = moment().year() + finSemestre;

    Meteor.call('ReservaAdmin', null, sala, actividad, profesor.concat(integrantes), 2, ini, fin, horario, 0, (err,res) => {
      Camara.update({_id: hash}, {$set: {idGrupo: res}});
    });
  },

  'borraGrupo'(id) {
    checkRole(this, 'admin');
    check(id, String);

    grupo = Camara.findOne({_id: id});
    Camara.remove({_id: id});
    Meteor.call('eliminaReserva', grupo.idGrupo, 0);
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
      Calendario.update({sala: salaOld.nombre}, {$set: {sala: nombre}}, {multi: true});
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
  'creaUsuario'(nombre, email, ocupacion, instrumento) {
    checkRole(this, 'admin');
    check(nombre, String);
    check(email, String);
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

    Accounts.sendEnrollmentEmail(id);

  },

  'creaUsuariosDesdeArchivo'(data) {
    checkRole(this, 'admin');

    for (let d in data) {
      let u = data[d];
      if (!Meteor.users.findOne({'emails.0.address': u.email}) ) {
        Meteor.call('creaUsuario',u.nombre, u.email, u.ocupacion, [u.instrumento]);
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

  'fechasPeriodo'(periodo, fechaIni, fechaFin) {
    checkRole(this, 'admin');

    Config.upsert({periodo: periodo}, {$set: {ini: fechaIni, fin: fechaFin}});

    Cursos.find({periodo: periodo}).map( (d) => {
      Meteor.call('modificaCurso', d._id, periodo, fechaIni, fechaFin, d.nombre, d.profesor, d.sala, d.horario);
    });
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

  'actualizaDB'() {
    let reservas = Reservas.find({"fechas.0": {$gt: "2020-02-24"}}).fetch();

    Reservas.remove({});
    Log.remove({});
    Config.remove({});
    Calendario.remove({});
    configuracion = {
      maxReservas: 2,
      maxCamaraPorSemana: 1,
      maxDCPorSemana: 1,
      mensaje: '',
    }

    Config.insert(configuracion);

    for (let i in reservas) {
      let sala = reservas[i].sala;
      let actividad = reservas[i].actividad;
      let integrantes = reservas[i].integrantes;
      let prioridad = reservas[i].prioridad;
      let ini = reservas[i].fechas[0];
      let fin = reservas[i].fechas[reservas[i].fechas.length - 1];

      let modulosBit = 0;
      for (let n in reservas[i].modulos) {
        let md = reservas[i].modulos[n];
        if (md == '1') modulosBit += 1;
        if (md == '2') modulosBit += 2;
        if (md == '3') modulosBit += 4;
        if (md == 'almuerzo') modulosBit += 8;
        if (md == '4') modulosBit += 16;
        if (md == '5') modulosBit += 32;
        if (md == '6') modulosBit += 64;
        if (md == '7') modulosBit += 128;
        if (md == '8') modulosBit += 256;
      }

      let horario = [0, 0, 0, 0, 0, 0, 0];
      for (let d in reservas[i].fechas) {
        let fecha = reservas[i].fechas[d];
        horario[moment(fecha).weekday()] = modulosBit;
      }

      Meteor.call('ReservaAdmin', null, sala, actividad, integrantes, prioridad, ini, fin, horario, 0);
    }

  },

});

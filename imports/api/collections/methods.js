import { Meteor } from 'meteor/meteor';

import { Salas } from './collections.js';
import { Reservas } from './collections.js';
import { Camara } from './collections.js';
import { Config } from './collections.js';

// Lanza un error si el usuario no tiene rol requerido
var checkRole = function(t, role) {
  if (! Roles.userIsInRole(t.userId, role))
    throw new Meteor.Error('Error','No autorizado');
}

//Retorna un array con todas las fechas entre dos fechas dadas
var fechasHastaDic = function(inicio) {
  var fechas = [];
  var f = inicio;
  var fin = moment("2017-12-15").format('YYYY-MM-DD');
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

  'reserva'(r) {
    checkRole(this, 'usuario');

    let duplicado = Reservas.find({fecha: r.fecha, modulo: r.modulo, integrantes: r.integrantes}).count();
    if (duplicado && r.integrantes) {
      throw new Meteor.Error('Error al insertar', 'Integrante ya tiene una reserva en ese módulo');
    }

    //Solo un admin puede sobreescrbir reservas
    let hayOtra = Reservas.find({sala: r.sala, fecha: r.fecha, modulo: r.modulo, prioridad: {$lte: r.prioridad}}).count();
    if (hayOtra) {
      checkRole(this, 'admin');
    }

    Reservas.upsert({sala: r.sala, fecha: r.fecha, modulo: r.modulo, actividad: r.actividad, integrantes: r.integrantes, prioridad: r.prioridad,
      owner: r.owner, timestamp: moment().format('YYYY-MM-DD HH:mm:ss')});
  },

  'eliminaRes'(r) {
    checkRole(this, 'usuario');

    Reservas.remove({_id: r._id});
  },

//------------Funciones de salas
  'listaSalas'() {
    var salas = [];
    Salas.find({}, {sort: {nombre: 1}}).forEach(function(u) {
      salas.push(u.nombre);
    });
    return salas;
  },

  'creaSala'(sala) {
    checkRole(this, 'superadmin');

    const existe = Salas.find({nombre: sala.nombre}).count();

    if (existe) {
      throw new Meteor.Error('Error al insertar', 'Ya existe una sala con ese nombre');
    }

    Salas.insert(sala);
  },

  'editaSala'(sala) {
    checkRole(this, 'superadmin');

    let salaOld = Salas.findOne({_id: sala._id});

    if (salaOld.nombre != sala.nombre)
      Reservas.update({sala: salaOld.nombre}, {$set: {sala: sala.nombre}}, {multi: true});

    Salas.update({_id: sala._id}, {$set: {
      nombre: sala.nombre,
      nombre2: sala.nombre2,
      prioridad: sala.prioridad,
      acepta: sala.acepta
    }});

    if (salaOld.nombre != sala.nombre)
      Reservas.update({sala: salaOld.nombre}, {$set: {sala: sala.nombre}}, {multi: true});
  },

  'borraSala'(sala) {
    checkRole(this, 'superadmin');

    Salas.remove({_id: sala._id});
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
    var usuarios = [];
    Meteor.users.find({}, {sort: {'profile.nombre':1}}).forEach(function(u) {
      if (u.profile.nombre != 'display')
        usuarios.push(u.profile.nombre);
    });
    return usuarios;
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

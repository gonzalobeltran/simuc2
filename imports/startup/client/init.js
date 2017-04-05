import { Config } from '/imports/api/collections/collections.js';

// Espera la suscripción de los roles antes de iniciar las rutas
FlowRouter.wait();
Tracker.autorun(() => {
  if (Roles.subscription.ready() && !FlowRouter._initialized) {
    FlowRouter.initialize()
  }

  Meteor.subscribe('config');
  Session.set('config', Config.findOne({}));
});

Subs = new SubsManager({
    cacheLimit: 10,
    expireIn: 5
  });

Meteor.startup(function(){
  // Selecciona español
  T9n.setLanguage("es");
  T9n.map('es', {
    error: {
      accounts: {
        'Login forbidden': 'Usuario o contraseña inválido'
      }
    }
  });

//------- Variables de sesión
  // La sala seleccionada actualmente
  Session.set('sala', '');
  //Para la paginación del log
  Session.set('logStep', 0);
  //Filtro del log
  Session.set('logFiltro', '');
  //Para mostrar errores
  Session.set('err', '');

  let actividades = ['-',
  'Música de Cámara',
  'Dirección Coral',
  'Composición',
  'Piano',
  'Violín',
  'Viola',
  'Cello',
  'Guitarra',
  'Flauta',
  'Oboe',
  'Clarinete',
  'Fagot',
  'Flauta Dulce',
  'Laúd',
  'Viola da Gamba',
  'Canto',
  'Contrabajo',
  'Clavecín',
  'Corno',
  'Trompeta',
  'Trombón',
  'Tuba',
  'Saxofón',
  'Percusión'];

  Session.set('actividades', actividades);

  let textoModulo = [
    {texto: 'Módulo', tipo: 'dark center smallText'},
    {texto: '1 (08:30-09:50)', tipo: 'dark center smallText'},
    {texto: '2 (10:00-11:20)', tipo: 'dark center smallText'},
    {texto: '3 (11:30-12:50)', tipo: 'dark center smallText'},
    {texto: 'Almuerzo', tipo: 'dark center smallText'},
    {texto: '4 (14:00-15:20)', tipo: 'dark center smallText'},
    {texto: '5 (15:30-16:50)', tipo: 'dark center smallText'},
    {texto: '6 (17:00-18:20)', tipo: 'dark center smallText'},
    {texto: '7 (18:30-19:50)', tipo: 'dark center smallText'},
    {texto: '8 (20:00-21:20)', tipo: 'dark center smallText'},
  ];

  let modulo = [
    'modulo',
    '1',
    '2',
    '3',
    'almuerzo',
    '4',
    '5',
    '6',
    '7',
    '8'
  ];

  Session.set('modulo', modulo);
  Session.set('textoModulo', textoModulo);

  // La fecha de hoy, en formato largo y corto
  Session.set('hoy', moment().format('YYYY-MM-DD'));
  Session.set('hoyCorto', moment(Session.get('hoy')).format('dd D/M'));
  var semanaDesdeHoy = [];
  var diasSemanaDesdeHoy = [];
  for (let d = 0; d < 7; d+=1) {
    // Guarda las fechas de una semana a partir de hoy
    semanaDesdeHoy.push( moment(Session.get('hoy')).add(d, 'day').format("YYYY-MM-DD") );
    diasSemanaDesdeHoy.push( moment(Session.get('hoy')).add(d, 'day').format("dd D/M") );
  }
  Session.set('semanaDesdeHoy', semanaDesdeHoy);
  Session.set('diasSemanaDesdeHoy', diasSemanaDesdeHoy);

  // Cambia las variables de sesión de fecha en función de la fecha seleccionada
  updateFechas = function(fecha) {
    var semana = ['Módulo'];
    var diasSemana = [{texto: 'Módulo', tipo: 'dark center smallText'}];
    for (let d = 0; d < 7; d+=1) {
      // Guarda las fechas de esta semana
      semana.push( moment(fecha).weekday(d).format("YYYY-MM-DD") );
      diasSemana.push( {texto: moment(fecha).weekday(d).format("dd D/M"), tipo: 'dark center smallText'} );
    }
    Session.set('fecha', moment(fecha).format('YYYY-MM-DD'));
    Session.set('semana', semana);
    Session.set('diasSemana', diasSemana);
    Session.set('fechaCorta', moment(fecha).format('dd D/M'));
  }

  updateFechas(moment());

  cambiaFecha = function(dias) {
    let fecha = moment(Session.get('fecha')).add(dias, 'day').format('YYYY-MM-DD');
    updateFechas(fecha);
  }


//------- Helpers globales
  Handlebars.registerHelper('separaConComa', function(txt) {
    return txt.join(", ");
  });

  Handlebars.registerHelper('ready', function() {
    return Session.get('ready');
  });

});

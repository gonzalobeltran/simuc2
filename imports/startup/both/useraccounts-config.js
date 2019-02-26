AccountsTemplates.configure({
  defaultLayout: 'AppBody',
  defaultContentRegion: 'main',
  defaultLayoutRegions: {},
  enablePasswordChange: true,
  showForgotPasswordLink: true,
  forbidClientAccountCreation: true,
  homeRoutePath: '/',
  onLogoutHook: function() {
    FlowRouter.go('/sign-in');
  }
});

AccountsTemplates.configureRoute('signIn');
AccountsTemplates.configureRoute('changePwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('enrollAccount');

var pwd = AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');
AccountsTemplates.addFields([
  {
      _id: "username",
      type: "text",
      displayName: "username",
      required: true,
      minLength: 4,
  },
  {
      _id: 'email',
      type: 'email',
      required: true,
      displayName: "email",
      re: /.+@(.+){2,}\.(.+){2,}/,
      errStr: 'Correo inválido',
  },
  {
      _id: 'username_and_email',
      type: 'text',
      required: true,
      placeholder: "ejemplo@uc.cl",
      displayName: "Correo UC",
  },
  {
    _id: 'password',
    type: 'password',
    displayName: "Contraseña",
    placeholder: {
      signIn: "Contraseña"
    },
    required: true
  }
]);

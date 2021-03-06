(function() {
  'use strict';

  angular.module('orrportal', [
    'ui.router',
    'ngSanitize',
    'ui.bootstrap'
    ,'ui.select'
    ,'xeditable'
    ,'vcRecaptcha'
    ,'angular-clipboard'
    ,'orrportal.main'
    ,'orrportal.facet'
    ,'orrportal.ontgrid'
    ,'orrportal.vocabulary'
    ,'orrportal.org'
    ,'orrportal.uri'
    ,'orrportal.ont'
    ,'orrportal.term'
    ,'orrportal.user'
    ,'orrportal.search'
    ,'orrportal.v2r'
    ,'orrportal.m2r'
    ,'orrportal.auth'
    ,'orrportal.auth.controllers'
    ,'orrportal.upload'
    ,'orrportal.util'
    ,'orrportal.items-viewer'
    ,'orrportal.admin'
  ])
    .constant("cfg", appConfig)
    .run(init)
    .run(xeditable)
  ;

  if (appUtil.requestedUri) {
    console.debug("appUtil.requestedUri defined ", appUtil.requestedUri, "Not configuring routes");
  }
  else {
    console.debug("appUtil.requestedUri undefined. Configuring routes");
    angular.module('orrportal')
      .config(uiRoutes)
      .run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
        if (appUtil.debug) {
          $rootScope.$state = $state;
          $rootScope.$stateParams = $stateParams;
        }
      }])
    ;
  }

  init.$inject = ['$rootScope', 'cfg'];

  function init($rootScope, cfg) {
    if (appUtil.debug) console.log("++INIT++");

    $rootScope.debug = appUtil.debug;
    $rootScope.cfg = cfg;

    var rvm = $rootScope.rvm = {
      accountInfo: undefined,
      rUri:       appUtil.requestedUri,
      rVersion:   appUtil.requestedVersion
    };

    if (appUtil.debug) {
      appUtil.debug.collapsed = true;
      appUtil.debug.model = {};
    }


    $rootScope.refresh = function() {
      $rootScope.$broadcast('evtRefresh');
    };

    $rootScope.$on('evtRefreshing', function(event, b) {
      $rootScope.refreshing = b;
    });

    $rootScope.userLoggedInIsAdmin = function() {
      return rvm.accountInfo && rvm.accountInfo.role === "admin";
    }
  }

  xeditable.$inject = ['editableOptions'];

  function xeditable(editableOptions) {
    editableOptions.theme = 'bs3';
  }

  uiRoutes.$inject = ['$stateProvider', '$urlRouterProvider'];
  function uiRoutes($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider
      .state('/',  {
        url: '/',
        template: '<orr-main></orr-main>'
      })

      .state('newvoc', {
        url: '/newvoc',
        params: { newFormat: 'v2r' },
        template: '<orr-ont></orr-ont>'
      })
      .state('newmap', {
        url: '/newmap',
        params: { newFormat: 'm2r' },
        template: '<orr-ont></orr-ont>'
      })

      .state('rx', {
        url: '/rx/{uriNewVersion:.*}',
        templateUrl: 'js/upload/sequence.html',
        controller: 'UploadController'
      })

      .state('neworg', {
        url: '/neworg',
        template: '<orr-org-create></orr-org-create>'
      })

      .state('searchOnt', {
        url: '/so/{so:.*}',
        template: '<orr-main></orr-main>'
      })

      .state('searchTerm', {
        url :'/st/{st:.*}',
        templateUrl: 'js/search/search.html',
        controller: 'SearchController'
      })

      .state('searchKw', {
        url: '/kw/{kw:.*}',
        templateUrl: 'js/search/search.html',
        controller: 'SearchController'
      })

      .state('org', {
        url: '/org/{orgName:.*}',
        template: '<orr-org></orr-org>'
      })

      .state('user', {
        url: '/user/{userName:.*}',
        template: '<orr-user></orr-user>'
      })

      .state('users', {
        url: '/users',
        template: '<admin-users></admin-users>'
      })

      .state('orgs', {
        url: '/orgs',
        template: '<admin-orgs></admin-orgs>'
      })

      .state('ts', {
        url: '/ts',
        template: '<orr-ts></orr-ts>'
      })

    ;
  }

  })();

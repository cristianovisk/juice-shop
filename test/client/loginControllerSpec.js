describe('controllers', function () {
  var scope, location, controller, window, cookieStore, $httpBackend

  beforeEach(module('juiceShop'))
  beforeEach(inject(function ($injector) {
    $httpBackend = $injector.get('$httpBackend')
  }))

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation()
    $httpBackend.verifyNoOutstandingRequest()
  })

  describe('LoginController', function () {
    beforeEach(inject(function ($rootScope, $window, $location, $cookieStore, $controller) {
      scope = $rootScope.$new()
      location = $location
      window = $window
      cookieStore = $cookieStore
      controller = $controller('LoginController', {
        '$scope': scope
      })
      scope.form = {$setPristine: function () {}}
    }))

    it('should be defined', inject(function ($controller) {
      expect(controller).toBeDefined()
      expect(scope.login).toBeDefined()
    }))

    it('forwards to main page after successful login', inject(function ($controller) {
      $httpBackend.whenPOST('/rest/user/login').respond(200, {token: 'auth_token'})

      scope.login()
      $httpBackend.flush()

      expect(location.path()).toBe('/')
    }))

    it('sets the returned authentication token as session cookie', inject(function ($controller) {
      $httpBackend.whenPOST('/rest/user/login').respond(200, {token: 'auth_token'})

      scope.login()
      $httpBackend.flush()

      expect(cookieStore.get('token')).toBe('auth_token')
    }))

    it('puts the returned basket id into browser session storage', inject(function ($controller) {
      $httpBackend.whenPOST('/rest/user/login').respond(200, {bid: 4711})

      scope.login()
      $httpBackend.flush()

      expect(window.sessionStorage.bid).toBe('4711')
    }))

    it('removes authentication token and basket id on failed login attempt', inject(function ($controller) {
      $httpBackend.whenPOST('/rest/user/login').respond(401)

      scope.login()
      $httpBackend.flush()

      expect(cookieStore.get('token')).toBeUndefined
      expect(window.sessionStorage.bid).toBeUndefined
    }))

    it('returns error message from server to client on failed login attempt', inject(function ($controller) {
      $httpBackend.whenPOST('/rest/user/login').respond(401, 'error')

      scope.login()
      $httpBackend.flush()

      expect(scope.error).toBe('error')
    }))
  })
})

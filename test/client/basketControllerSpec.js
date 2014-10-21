describe('controllers', function () {
    var scope, controller, $window, $httpBackend;

    beforeEach(module('myApp'));

    beforeEach(function() {
        $window = {location: { replace: jasmine.createSpy()}, sessionStorage: {bid: 42} };

        module(function($provide) {
            $provide.value('$window', $window);
        });
    })

    beforeEach(inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
    }));

    describe('BasketController', function () {
        beforeEach(inject(function ($rootScope, $window, $controller) {
            scope = $rootScope.$new();
            controller = $controller('BasketController', {
                '$scope': scope
            });
        }));

        it('should be defined', inject(function ($controller) {
            expect(controller).toBeDefined();
            expect(scope.delete).toBeDefined();
            expect(scope.order).toBeDefined();
            expect(scope.inc).toBeDefined();
            expect(scope.dec).toBeDefined();
        }));

        it('should hold products returned by backend API', inject(function ($controller) {
            $httpBackend.whenGET('/rest/basket/42').respond(200,  {data: {products: [{description: 'a'},{description: 'b'}]}});

            $httpBackend.flush();

            expect(scope.products).toBeDefined();
            expect(scope.products.length).toBe(2);
            expect(scope.products[0].description).toBeDefined();
            expect(scope.products[1].description).toBeDefined();
        }));

        it('should hold no products when none are returned by backend API', inject(function ($controller) {
            $httpBackend.whenGET('/rest/basket/42').respond(200, {data: {products: []}});

            $httpBackend.flush();

            expect(scope.products).toEqual({});
        }));

        it('should hold no products on error in backend API', inject(function ($controller) {
            $httpBackend.whenGET('/rest/basket/42').respond(500);

            $httpBackend.flush();

            expect(scope.products).toBeUndefined();
        }));

        it('should pass delete request for basket item to backend API', inject(function ($controller) {
            $httpBackend.whenGET('/rest/basket/42').respond(200,  {data: {products: [{basketItem: {id: 1}}]}});
            $httpBackend.whenDELETE('/api/BasketItems/1').respond(200);

            scope.delete(1);
            $httpBackend.flush();
        }));

        it('should gracefully handle error while deleting basket item', inject(function ($controller) {
            $httpBackend.whenGET('/rest/basket/42').respond(200, {data: {products: [{basketItem: {id: 1}}]}});
            $httpBackend.whenDELETE('/api/BasketItems/1').respond(500);

            scope.delete(1);
            $httpBackend.flush();
        }));

        it('should redirect to confirmation URL after ordering basket', inject(function ($controller) {
            $httpBackend.whenGET('/rest/basket/42').respond(200,  {data: {products: [{basketItem: {id: 1}}]}});
            $httpBackend.whenPOST('/rest/basket/42/order').respond(200, 'confirmationUrl');

            scope.order();
            $httpBackend.flush();

            expect($window.location.replace).toHaveBeenCalledWith('confirmationUrl');
        }));

        it('should not redirect anywhere when ordering basket fails', inject(function ($controller) {
            $httpBackend.whenGET('/rest/basket/42').respond(200,  {data: {products: [{basketItem: {id: 1}}]}});
            $httpBackend.whenPOST('/rest/basket/42/order').respond(500);

            scope.order();
            $httpBackend.flush();

            expect($window.location.replace.mostRecentCall).toEqual({});
        }));
    });

});

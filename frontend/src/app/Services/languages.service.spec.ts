import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { fakeAsync, inject, TestBed, tick } from '@angular/core/testing'

import { LanguagesService } from './languages.service'

describe('LanguagesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: LanguagesService = TestBed.get(LanguagesService)
    expect(service).toBeTruthy()
  })

  it('should get the language list through the rest API', inject([LanguagesService, HttpTestingController],
    fakeAsync((service: LanguagesService, httpMock: HttpTestingController) => {
      let res
      service.getLanguages().subscribe((data) => res = data)

      const req = httpMock.expectOne('http://localhost:3000/rest/language-list')
      req.flush('apiResponse')

      tick()

      expect(req.request.method).toBe('GET')
      expect(res).toBe('apiResponse')

      httpMock.verify()
    })
  ))
})

/*
  Unit tests for the rest-api controllers index.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import RESTControllers from '../../../../src/controllers/rest-api/index.js'

describe('#controllers/rest-api/index.js', () => {
  let sandbox
  let mockAdapters
  let mockUseCases

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockAdapters = {}
    mockUseCases = {}
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create RESTControllers instance with adapters and useCases', () => {
      const controllers = new RESTControllers({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      assert.isNotNull(controllers)
      assert.equal(controllers.adapters, mockAdapters)
      assert.equal(controllers.useCases, mockUseCases)
      assert.property(controllers, 'config')
    })

    it('should throw error when adapters are not provided', () => {
      assert.throws(
        () => new RESTControllers({ useCases: mockUseCases }),
        /Instance of Adapters library required/
      )
    })

    it('should throw error when useCases are not provided', () => {
      assert.throws(
        () => new RESTControllers({ adapters: mockAdapters }),
        /Instance of Use Cases library required/
      )
    })
  })

  describe('#attachRESTControllers', () => {
    it('should attach REST controllers to app', () => {
      const controllers = new RESTControllers({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const mockApp = {
        use: sandbox.stub()
      }

      controllers.attachRESTControllers(mockApp)

      // Verify that routes were attached
      assert.isTrue(mockApp.use.called)
    })

    it('should throw error when app is not provided', () => {
      const controllers = new RESTControllers({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      assert.throws(
        () => controllers.attachRESTControllers(null),
        /Must pass app object/
      )
    })
  })
})

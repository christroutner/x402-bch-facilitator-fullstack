/*
  Unit tests for the controllers index.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import Controllers from '../../../src/controllers/index.js'

describe('#controllers/index.js', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create Controllers instance', () => {
      const controllers = new Controllers()
      assert.isNotNull(controllers)
      assert.property(controllers, 'adapters')
      assert.property(controllers, 'useCases')
      assert.property(controllers, 'config')
    })
  })

  describe('#initAdapters', () => {
    it('should initialize adapters', async () => {
      const controllers = new Controllers()
      // The Controllers class creates real Adapters instance
      // We need to verify that start() is called on the real instance
      const startSpy = sandbox.spy(controllers.adapters, 'start')
      await controllers.initAdapters()

      assert.isTrue(startSpy.calledOnce)
    })
  })

  describe('#initUseCases', () => {
    it('should initialize use cases', async () => {
      const controllers = new Controllers()
      // The Controllers class creates real UseCases instance
      // We need to verify that start() is called on the real instance
      const startSpy = sandbox.spy(controllers.useCases, 'start')
      await controllers.initUseCases()

      assert.isTrue(startSpy.calledOnce)
    })
  })

  describe('#attachRESTControllers', () => {
    it('should attach REST controllers to app', () => {
      const controllers = new Controllers()
      const mockApp = {
        use: sandbox.stub()
      }

      controllers.attachRESTControllers(mockApp)

      // Verify that REST controllers were attached
      // The actual attachment is done by RESTControllers class
      assert.isTrue(mockApp.use.called)
    })
  })
})

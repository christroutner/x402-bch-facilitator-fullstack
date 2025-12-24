/*
  Unit tests for the facilitator router.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import FacilitatorRouter from '../../../../../src/controllers/rest-api/facilitator/index.js'

describe('#controllers/rest-api/facilitator/index.js', () => {
  let sandbox
  let mockAdapters
  let mockUseCases
  let mockRouter

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockAdapters = {}
    mockUseCases = {}
    mockRouter = {
      get: sandbox.stub(),
      post: sandbox.stub()
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create FacilitatorRouter instance', () => {
      const router = new FacilitatorRouter({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      assert.isNotNull(router)
      assert.equal(router.adapters, mockAdapters)
      assert.equal(router.useCases, mockUseCases)
      assert.property(router, 'router')
    })

    it('should throw error when adapters are not provided', () => {
      assert.throws(
        () => new FacilitatorRouter({ useCases: mockUseCases }),
        /Instance of Adapters library required/
      )
    })

    it('should throw error when useCases are not provided', () => {
      assert.throws(
        () => new FacilitatorRouter({ adapters: mockAdapters }),
        /Instance of Use Cases library required/
      )
    })
  })

  describe('#attach', () => {
    it('should attach routes to app', () => {
      const router = new FacilitatorRouter({
        adapters: mockAdapters,
        useCases: mockUseCases
      })
      router.router = mockRouter

      const mockApp = {
        use: sandbox.stub()
      }

      router.attach(mockApp)

      // Verify routes were registered
      assert.isTrue(mockRouter.get.calledWith('/supported', sinon.match.func))
      assert.isTrue(mockRouter.post.calledWith('/verify', sinon.match.func))
      assert.isTrue(mockRouter.post.calledWith('/settle', sinon.match.func))
      assert.isTrue(mockApp.use.calledWith('/facilitator', mockRouter))
    })

    it('should throw error when app is not provided', () => {
      const router = new FacilitatorRouter({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      assert.throws(
        () => router.attach(null),
        /Must pass app object/
      )
    })
  })
})

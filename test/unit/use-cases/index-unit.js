/*
  Unit tests for the use-cases index.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import UseCases from '../../../src/use-cases/index.js'

describe('#use-cases/index.js', () => {
  let sandbox
  let mockAdapters
  let mockLogger

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockLogger = {
      info: sandbox.stub()
    }
    mockAdapters = {
      logger: mockLogger
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create UseCases instance with adapters', () => {
      const useCases = new UseCases({ adapters: mockAdapters })
      assert.isNotNull(useCases)
      assert.property(useCases, 'adapters')
      assert.equal(useCases.adapters, mockAdapters)
      assert.property(useCases, 'facilitator')
    })

    it('should throw error when adapters are not provided', () => {
      assert.throws(
        () => new UseCases(),
        /Instance of adapters must be passed in/
      )
    })
  })

  describe('#start', () => {
    it('should start use cases and log success', async () => {
      const useCases = new UseCases({ adapters: mockAdapters })
      const result = await useCases.start()

      assert.isTrue(mockLogger.info.calledOnce)
      assert.isTrue(mockLogger.info.calledWith('Use Cases have been started.'))
      assert.isTrue(result)
    })
  })
})

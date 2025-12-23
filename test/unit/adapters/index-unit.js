/*
  Unit tests for the adapters index.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import Adapters from '../../../src/adapters/index.js'

describe('#adapters/index.js', () => {
  let sandbox
  let mockLogger
  let mockLevelDBAdapter

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockLogger = {
      info: sandbox.stub(),
      error: sandbox.stub()
    }
    mockLevelDBAdapter = {
      openDb: sandbox.stub().resolves({ utxoDb: {} })
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create Adapters instance with all adapters', () => {
      const adapters = new Adapters()
      assert.isNotNull(adapters)
      assert.property(adapters, 'config')
      assert.property(adapters, 'logger')
      assert.property(adapters, 'bchWallet')
      assert.property(adapters, 'levelDB')
    })
  })

  describe('#start', () => {
    it('should initialize levelDB and log success', async () => {
      const adapters = new Adapters()
      adapters.levelDB = mockLevelDBAdapter
      adapters.logger = mockLogger

      const result = await adapters.start()

      assert.isTrue(mockLevelDBAdapter.openDb.calledOnce)
      assert.isTrue(mockLogger.info.calledOnce)
      assert.isTrue(mockLogger.info.calledWith('Level DB adapter initialized.'))
      assert.isTrue(result)
    })

    it('should handle errors during initialization', async () => {
      const adapters = new Adapters()
      adapters.levelDB = mockLevelDBAdapter
      adapters.logger = mockLogger

      const testError = new Error('DB initialization failed')
      mockLevelDBAdapter.openDb.rejects(testError)

      try {
        await adapters.start()
        assert.fail('Expected error to be thrown')
      } catch (err) {
        assert.equal(err, testError)
        assert.isTrue(mockLogger.error.calledOnce)
        assert.isTrue(mockLogger.error.calledWith('Error in adapters/index.js/start()', testError))
      }
    })
  })
})

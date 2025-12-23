/*
  Unit tests for the leveldb adapter.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import LevelDBAdapter from '../../../src/adapters/leveldb.js'

describe('#adapters/leveldb.js', () => {
  let sandbox
  let mockLevelDb
  let levelStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockLevelDb = {
      close: sandbox.stub().resolves()
    }
    levelStub = sandbox.stub().returns(mockLevelDb)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create LevelDBAdapter instance', () => {
      const adapter = new LevelDBAdapter()
      assert.isNotNull(adapter)
      assert.isNull(adapter.utxoDb)
      assert.isFunction(adapter.openDb)
    })
  })

  describe('#openDb', () => {
    it('should open database and return utxoDb', () => {
      const adapter = new LevelDBAdapter()
      adapter.level = levelStub

      const result = adapter.openDb()

      assert.isTrue(levelStub.calledOnce)
      assert.equal(adapter.utxoDb, mockLevelDb)
      assert.property(result, 'utxoDb')
      assert.equal(result.utxoDb, mockLevelDb)
    })
  })

  describe('#closeDb', () => {
    it('should close database if it exists', async () => {
      const adapter = new LevelDBAdapter()
      adapter.utxoDb = mockLevelDb

      const result = await adapter.closeDb()

      assert.isTrue(mockLevelDb.close.calledOnce)
      assert.isNull(adapter.utxoDb)
      assert.isTrue(result)
    })

    it('should return true if database does not exist', async () => {
      const adapter = new LevelDBAdapter()
      adapter.utxoDb = null

      const result = await adapter.closeDb()

      assert.isTrue(mockLevelDb.close.notCalled)
      assert.isTrue(result)
    })
  })
})

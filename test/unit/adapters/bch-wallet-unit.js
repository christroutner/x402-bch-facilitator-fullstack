/*
  Unit tests for the bch-wallet adapter.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import BCHWalletAdapter from '../../../src/adapters/bch-wallet.js'

describe('#adapters/bch-wallet.js', () => {
  let sandbox
  let mockMsWallet
  let mockRetryQueue
  let mockConfig

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockRetryQueue = {
      addToQueue: sandbox.stub()
    }
    mockMsWallet = {
      walletInfoPromise: Promise.resolve(),
      getTxData: sandbox.stub()
    }
    mockConfig = {
      apiType: 'consumer-api',
      bchServerUrl: 'http://test-server',
      serverBchAddress: 'bitcoincash:qptest'
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create BCHWalletAdapter instance', () => {
      // We need to mock the imports, but since we can't easily do that,
      // we'll test the constructor indirectly through other methods
      const adapter = new BCHWalletAdapter()
      assert.isNotNull(adapter)
      assert.isFunction(adapter.validateUtxo)
    })
  })

  describe('#validateUtxo', () => {
    it('should validate UTXO with correct receiver address', async () => {
      const adapter = new BCHWalletAdapter()
      adapter.msWallet = mockMsWallet
      adapter.config = mockConfig
      adapter.retryQueue = mockRetryQueue

      const mockTxData = [{
        vout: [{
          scriptPubKey: {
            addresses: [mockConfig.serverBchAddress]
          },
          value: 0.00002 // 2000 sats
        }]
      }]

      mockRetryQueue.addToQueue.resolves(mockTxData)

      const result = await adapter.validateUtxo({ txid: 'test-txid', vout: 0 })

      assert.isTrue(result.isValid)
      assert.equal(result.invalidReason, 'valid_utxo')
      assert.equal(result.utxoAmountSat, 2000)
    })

    it('should return invalid when receiver address does not match', async () => {
      const adapter = new BCHWalletAdapter()
      adapter.msWallet = mockMsWallet
      adapter.config = mockConfig
      adapter.retryQueue = mockRetryQueue

      const mockTxData = [{
        vout: [{
          scriptPubKey: {
            addresses: ['bitcoincash:wrong-address']
          },
          value: 0.00002
        }]
      }]

      mockRetryQueue.addToQueue.resolves(mockTxData)

      const result = await adapter.validateUtxo({ txid: 'test-txid', vout: 0 })

      assert.isFalse(result.isValid)
      assert.equal(result.invalidReason, 'invalid_receiver_address')
      assert.isNull(result.utxoAmountSat)
    })

    it('should handle errors gracefully', async () => {
      const adapter = new BCHWalletAdapter()
      adapter.msWallet = mockMsWallet
      adapter.config = mockConfig
      adapter.retryQueue = mockRetryQueue

      const testError = new Error('Network error')
      mockRetryQueue.addToQueue.rejects(testError)

      const result = await adapter.validateUtxo({ txid: 'test-txid', vout: 0 })

      assert.isFalse(result.isValid)
      assert.equal(result.invalidReason, 'Network error')
      assert.isNull(result.utxoAmountSat)
    })

    it('should wait for wallet to be ready', async () => {
      const adapter = new BCHWalletAdapter()
      adapter.msWallet = mockMsWallet
      adapter.config = mockConfig
      adapter.retryQueue = mockRetryQueue

      const walletReadySpy = sandbox.spy()
      adapter.msWallet.walletInfoPromise = Promise.resolve().then(walletReadySpy)

      const mockTxData = [{
        vout: [{
          scriptPubKey: {
            addresses: [mockConfig.serverBchAddress]
          },
          value: 0.00001
        }]
      }]

      mockRetryQueue.addToQueue.resolves(mockTxData)

      await adapter.validateUtxo({ txid: 'test-txid', vout: 0 })

      // Verify wallet was ready before proceeding
      assert.isTrue(mockRetryQueue.addToQueue.calledAfter(walletReadySpy))
    })
  })
})

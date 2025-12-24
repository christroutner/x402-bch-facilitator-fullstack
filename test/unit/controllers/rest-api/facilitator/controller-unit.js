/*
  Unit tests for the facilitator REST controller.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import FacilitatorRESTControllerLib from '../../../../../src/controllers/rest-api/facilitator/controller.js'

describe('#controllers/rest-api/facilitator/controller.js', () => {
  let sandbox
  let mockAdapters
  let mockUseCases
  let mockLogger
  let mockFacilitatorUseCase

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockLogger = {
      error: sandbox.stub()
    }
    mockFacilitatorUseCase = {
      listSupportedKinds: sandbox.stub().returns({ kinds: [] }),
      verifyPayment: sandbox.stub().resolves({
        isValid: true,
        payer: 'bitcoincash:qptest'
      }),
      settlePayment: sandbox.stub().resolves({
        success: true,
        transaction: 'tx123'
      })
    }
    mockAdapters = {
      logger: mockLogger
    }
    mockUseCases = {
      facilitator: mockFacilitatorUseCase
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create FacilitatorRESTControllerLib instance', () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      assert.isNotNull(controller)
      assert.equal(controller.adapters, mockAdapters)
      assert.equal(controller.useCases, mockUseCases)
    })

    it('should throw error when adapters are not provided', () => {
      assert.throws(
        () => new FacilitatorRESTControllerLib({ useCases: mockUseCases }),
        /Instance of Adapters library required/
      )
    })

    it('should throw error when useCases are not provided', () => {
      assert.throws(
        () => new FacilitatorRESTControllerLib({ adapters: mockAdapters }),
        /Instance of Use Cases library required/
      )
    })
  })

  describe('#listSupportedKinds', () => {
    it('should return supported kinds', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const mockReq = {}
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.listSupportedKinds(mockReq, mockRes)

      assert.isTrue(mockFacilitatorUseCase.listSupportedKinds.calledOnce)
      assert.isTrue(mockRes.status.calledWith(200))
      assert.isTrue(mockRes.json.calledOnce)
    })

    it('should handle errors', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const testError = new Error('Test error')
      mockFacilitatorUseCase.listSupportedKinds.throws(testError)

      const mockReq = {}
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.listSupportedKinds(mockReq, mockRes)

      assert.isTrue(mockLogger.error.calledOnce)
      assert.isTrue(mockRes.status.calledWith(500))
    })
  })

  describe('#verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const mockReq = {
        body: {
          x402Version: 2,
          paymentPayload: { test: 'payload' },
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.verifyPayment(mockReq, mockRes)

      assert.isTrue(mockFacilitatorUseCase.verifyPayment.calledOnce)
      assert.isTrue(mockRes.status.calledWith(200))
      assert.isTrue(mockRes.json.calledOnce)
    })

    it('should include optional response fields when available', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      mockFacilitatorUseCase.verifyPayment.resolves({
        isValid: true,
        payer: 'bitcoincash:qptest',
        remainingBalanceSat: '9000',
        ledgerEntry: {
          utxoId: 'tx123:0',
          transactionValueSat: '20000',
          totalDebitedSat: '11000',
          lastUpdated: '2025-11-08T17:05:42.000Z'
        }
      })

      const mockReq = {
        body: {
          x402Version: 2,
          paymentPayload: { test: 'payload' },
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.verifyPayment(mockReq, mockRes)

      const jsonCall = mockRes.json.firstCall.args[0]
      assert.isTrue(jsonCall.isValid)
      assert.equal(jsonCall.payer, 'bitcoincash:qptest')
      assert.equal(jsonCall.remainingBalanceSat, '9000')
      assert.property(jsonCall, 'ledgerEntry')
      assert.equal(jsonCall.ledgerEntry.utxoId, 'tx123:0')
    })

    it('should return 400 when paymentPayload is missing', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const mockReq = {
        body: {
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.verifyPayment(mockReq, mockRes)

      assert.isTrue(mockFacilitatorUseCase.verifyPayment.notCalled)
      assert.isTrue(mockRes.status.calledWith(400))
      assert.isTrue(mockRes.json.calledWith({ error: 'Missing paymentPayload or paymentRequirements' }))
    })

    it('should return 400 when paymentRequirements is missing', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const mockReq = {
        body: {
          paymentPayload: { test: 'payload' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.verifyPayment(mockReq, mockRes)

      assert.isTrue(mockFacilitatorUseCase.verifyPayment.notCalled)
      assert.isTrue(mockRes.status.calledWith(400))
    })

    it('should include invalidReason when payment is invalid', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      mockFacilitatorUseCase.verifyPayment.resolves({
        isValid: false,
        invalidReason: 'invalid_signature',
        payer: 'bitcoincash:qptest'
      })

      const mockReq = {
        body: {
          paymentPayload: { test: 'payload' },
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.verifyPayment(mockReq, mockRes)

      const jsonCall = mockRes.json.firstCall.args[0]
      assert.isFalse(jsonCall.isValid)
      assert.equal(jsonCall.invalidReason, 'invalid_signature')
    })

    it('should handle errors', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const testError = new Error('Test error')
      mockFacilitatorUseCase.verifyPayment.rejects(testError)

      const mockReq = {
        body: {
          paymentPayload: { test: 'payload' },
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.verifyPayment(mockReq, mockRes)

      assert.isTrue(mockLogger.error.calledOnce)
      assert.isTrue(mockRes.status.calledWith(500))
    })
  })

  describe('#settlePayment', () => {
    it('should settle payment successfully', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const mockReq = {
        body: {
          x402Version: 2,
          paymentPayload: { test: 'payload' },
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.settlePayment(mockReq, mockRes)

      assert.isTrue(mockFacilitatorUseCase.settlePayment.calledOnce)
      assert.isTrue(mockRes.status.calledWith(200))
      assert.isTrue(mockRes.json.calledOnce)
    })

    it('should return 400 when paymentPayload is missing', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const mockReq = {
        body: {
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.settlePayment(mockReq, mockRes)

      assert.isTrue(mockFacilitatorUseCase.settlePayment.notCalled)
      assert.isTrue(mockRes.status.calledWith(400))
    })

    it('should handle errors', async () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const testError = new Error('Test error')
      mockFacilitatorUseCase.settlePayment.rejects(testError)

      const mockReq = {
        body: {
          paymentPayload: { test: 'payload' },
          paymentRequirements: { test: 'requirements' }
        }
      }
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      await controller.settlePayment(mockReq, mockRes)

      assert.isTrue(mockLogger.error.calledOnce)
      assert.isTrue(mockRes.status.calledWith(500))
    })
  })

  describe('#handleError', () => {
    it('should handle errors and return 500', () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const testError = new Error('Test error')
      const mockReq = {}
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      controller.handleError(testError, mockReq, mockRes)

      assert.isTrue(mockLogger.error.calledOnce)
      assert.isTrue(mockRes.status.calledWith(500))
      assert.isTrue(mockRes.json.calledWith({
        error: 'Test error'
      }))
    })

    it('should handle errors without message', () => {
      const controller = new FacilitatorRESTControllerLib({
        adapters: mockAdapters,
        useCases: mockUseCases
      })

      const testError = {}
      const mockReq = {}
      const mockRes = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      }

      controller.handleError(testError, mockReq, mockRes)

      assert.isTrue(mockRes.json.calledWith({
        error: 'Internal server error'
      }))
    })
  })
})

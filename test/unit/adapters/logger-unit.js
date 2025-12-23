/*
  Unit tests for the logger adapter.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Unit under test
import Logger from '../../../src/adapters/logger.js'

describe('#adapters/logger.js', () => {
  let sandbox
  let consoleLogStub
  let consoleErrorStub
  let consoleWarnStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    consoleLogStub = sandbox.stub(console, 'log')
    consoleErrorStub = sandbox.stub(console, 'error')
    consoleWarnStub = sandbox.stub(console, 'warn')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should create logger with default log level', () => {
      const logger = new Logger()
      assert.equal(logger.logLevel, 'info')
    })

    it('should create logger with custom log level', () => {
      const logger = new Logger({ logLevel: 'debug' })
      assert.equal(logger.logLevel, 'debug')
    })
  })

  describe('#info', () => {
    it('should log info message', () => {
      const logger = new Logger()
      logger.info('test message')
      assert.isTrue(consoleLogStub.calledOnce)
      assert.isTrue(consoleLogStub.calledWith('[INFO] test message'))
    })
  })

  describe('#error', () => {
    it('should log error message without error object', () => {
      const logger = new Logger()
      logger.error('test error')
      assert.isTrue(consoleErrorStub.calledOnce)
      assert.isTrue(consoleErrorStub.calledWith('[ERROR] test error'))
    })

    it('should log error message with error object', () => {
      const logger = new Logger()
      const err = new Error('test error')
      logger.error('test error', err)
      assert.isTrue(consoleErrorStub.calledOnce)
      assert.isTrue(consoleErrorStub.calledWith('[ERROR] test error', err))
    })
  })

  describe('#warn', () => {
    it('should log warn message', () => {
      const logger = new Logger()
      logger.warn('test warning')
      assert.isTrue(consoleWarnStub.calledOnce)
      assert.isTrue(consoleWarnStub.calledWith('[WARN] test warning'))
    })
  })

  describe('#debug', () => {
    it('should not log debug message when log level is not debug', () => {
      const logger = new Logger({ logLevel: 'info' })
      logger.debug('test debug')
      assert.isTrue(consoleLogStub.notCalled)
    })

    it('should log debug message when log level is debug', () => {
      const logger = new Logger({ logLevel: 'debug' })
      logger.debug('test debug')
      assert.isTrue(consoleLogStub.calledOnce)
      assert.isTrue(consoleLogStub.calledWith('[DEBUG] test debug'))
    })
  })
})

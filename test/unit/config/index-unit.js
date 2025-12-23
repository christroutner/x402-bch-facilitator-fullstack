/*
  Unit tests for the config index.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { readFileSync } from 'fs'

// Unit under test
import config from '../../../src/config/index.js'

describe('#config/index.js', () => {
  let sandbox
  let originalEnv

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    sandbox.restore()
  })

  describe('#config', () => {
    it('should have all required properties', () => {
      assert.property(config, 'port')
      assert.property(config, 'env')
      assert.property(config, 'logLevel')
      assert.property(config, 'version')
      assert.property(config, 'serverBchAddress')
      assert.property(config, 'apiType')
      assert.property(config, 'bchServerUrl')
    })

    it('should have port property', () => {
      assert.isNumber(config.port)
    })

    it('should use default env when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV
      assert.equal(config.env, 'development')
    })

    it('should use default logLevel when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL
      assert.equal(config.logLevel, 'info')
    })

    it('should have a version from package.json', () => {
      const pkgInfo = JSON.parse(readFileSync('package.json', 'utf8'))
      assert.equal(config.version, pkgInfo.version)
    })

    it('should have default serverBchAddress', () => {
      assert.isString(config.serverBchAddress)
      assert.isNotEmpty(config.serverBchAddress)
    })

    it('should have default apiType', () => {
      assert.equal(config.apiType, 'consumer-api')
    })

    it('should have default bchServerUrl', () => {
      assert.isString(config.bchServerUrl)
      assert.isNotEmpty(config.bchServerUrl)
    })
  })
})

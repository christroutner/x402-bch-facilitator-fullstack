/*
  Adapter library for working with Level DB.
*/

// Global libraries
import level from 'level'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const dbDir = `${__dirname.toString()}/../../leveldb`

class LevelDBAdapter {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.level = level

    // Placeholders
    this.utxoDb = null
    this.addressDb = null

    // Bind 'this' object to all class methods
    this.openDb = this.openDb.bind(this)
  }

  openDb () {
    this.utxoDb = this.level(`${dbDir}/utxo`, {
      valueEncoding: 'json',
      cacheSize: 1024 * 1024 * 10 // 10MB
    })

    this.addressDb = this.level(`${dbDir}/address`, {
      valueEncoding: 'json',
      cacheSize: 1024 * 1024 * 10 // 10MB
    })

    return {
      utxoDb: this.utxoDb,
      addressDb: this.addressDb
    }
  }

  async closeDb () {
    if (this.utxoDb) {
      await this.utxoDb.close()
      this.utxoDb = null
    }

    if (this.addressDb) {
      await this.addressDb.close()
      this.addressDb = null
    }

    return true
  }
}

export default LevelDBAdapter

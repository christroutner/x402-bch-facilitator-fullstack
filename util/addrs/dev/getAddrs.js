/*
  Utility tool to retrieve all address keys in the Address DB.
*/

// const level = require('level')
import level from 'level'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const addressDb = level(`${__dirname.toString()}/../../../leveldb/address`, {
  valueEncoding: 'json'
})

async function getAddrs () {
  try {
    const stream = addressDb.createReadStream()

    stream.on('data', function (data) {
      console.log(data.key, ' = ', data.value)
    })
  } catch (err) {
    console.error(err.message)
  }
}
getAddrs()


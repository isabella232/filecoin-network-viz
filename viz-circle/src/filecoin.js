const GetRandomInt = require('./utils').GetRandomInt

module.exports = class Filecoin {
  constructor (miners = [], clients = [], chain = [], orderbook = []) {
    this.chain = chain
    this.orderbook = orderbook
    this.miners = miners.map((d, i) => {
      d.type = 'miner',
      d.balance = miners[i].balance || 10
      d.storage = miners[i].balance || 0
      d.cmdAddr = miners[i].cmdAddr || ':9090'
      return d
    })
    this.clients = clients.map(d => {
      d.type = 'client',
      d.balance = 10
      return d
    })
    this.events = [
      'BroadcastBlock',
      'AddAsk',
      'AddBid',
      'MakeDeal',
      'SendFile',
      'SendPayment'
    ]
  }

  GetNode (address) {
    const node = this.nodes.find(d => d.id === address)

    return node
  }

  RandomEvent () {
    let event = this.events[1 + Math.floor(Math.random() * (this.events.length - 1))]
    return this[event]()
  }

  MinerJoins (obj = {}) {
    const {from, balance, storage, cmdAddr} = obj

    this.miners.push({
      type: 'miner',
      id: from,
      balance: balance || 0,
      storage: storage || 0,
      cmdAddr: cmdAddr || ':9090'
    })

    return {
      name: 'MinerJoins',
      data: {},
      actions: []
    }
  }

  ClientJoins (obj = {}) {
    const {from, balance, storage} = obj

    this.clients.push({
      type: 'client',
      id: from,
      balance: balance || 0
    })

    return {
      name: 'ClientJoins',
      data: {},
      actions: []
    }
  }

  BroadcastBlock (obj = {}) {
    const {from, block} = obj
    if (!from) console.log('ops: from not passed')
    if (!block) console.log('ops: block not passed')

    const miner = this.GetNode(from) || this.RandomMiner()
    const id = block || (Date.now() + '').split('').reverse().join('')

    miner.balance += 10
    this.chain.push({id, miner})

    return {
      name: 'BroadcastBlock',
      data: {
        links: this.GenerateBroadcast(miner)
      },
      actions: [{
        type: 'send',
        color: '#666',
        marker: 'block'
      }]
    }
  }

  AddAsk (obj = {}) {
    const {from, price, size} = obj
    if (!from) console.log('ops: from not passed')
    const actor = this.GetNode(from) || this.RandomMiner()

    this.orderbook.push({
      type: 'ask',
      size: size || GetRandomInt(1, 10),
      price: price || GetRandomInt(12, 30)
    })

    return {
      name: 'AddAsk',
      data: {
        actors: [actor]
      },
      actions: [{
        type: 'icon',
        name: 'ask'
      }]
    }
  }

  AddBid (obj = {}) {
    const {from, price, size} = obj
    if (!from) console.log('ops: from not passed')
    const actor = this.GetNode(from) || this.RandomClient()

    this.orderbook.push({
      type: 'bid',
      size: size || GetRandomInt(1, 10),
      price: price || GetRandomInt(0, 15)
    })

    return {
      name: 'AddBid',
      data: {
        actors: [actor]
      },
      actions: [{
        type: 'icon',
        name: 'bid'
      }]
    }
  }

  MakeDeal (obj = {}) {
    let {from, to} = obj
    if (!from) console.log('ops: from not passed')
    if (!to) console.log('ops: to not passed')

    from = this.GetNode(from) || this.RandomClient()
    to = this.GetNode(to) || this.RandomMiner()

    return {
      name: 'MakeDeal',
      data: {
        actors: [from, to],
        links: [this.GenerateLink(from, to)]
      },
      actions: [{
        type: 'icon',
        name: 'deal'
      }, {
        type: 'line',
        color: 'green'
      }]
    }
  }

  SendFile (obj = {}) {
    let {from, to} = obj
    if (!from) console.log('ops: from not passed')
    if (!to) console.log('ops: to not passed')

    from = this.GetNode(from) || this.RandomClient()
    to = this.GetNode(to) || this.RandomMiner()
    return {
      name: 'SendFile',
      data: {
        links: [this.GenerateLink(from, to)]
      },
      actions: [{
        type: 'send',
        color: 'gray',
        marker: 'file'
      }]
    }
  }

  NewBlockMined (obj = {}) {
    let {from} = obj
    if (!from) console.log('ops: from not passed')

    from = this.GetNode(from) || this.RandomMiner()

    return {
      name: 'NewBlockMined',
      data: {
        actors: [from]
      },
      actions: [{
        type: 'icon',
        name: 'block'
      }]
    }
  }

  SendPayment (obj = {}) {
    let {from, to, value} = obj
    if (!from) console.log('ops: from not passed')
    if (!to) console.log('ops: to not passed')

    to = this.GetNode(to) || this.RandomClient()
    from = this.GetNode(from) || this.RandomClient()
    value = value || GetRandomInt(1, from.balance)

    if (from.balance == 0) {
      console.log('no balance!!!!!')
      return false
    }

    from.balance -= value
    to.balance += value

    return {
      name: 'SendPayment',
      data: {
        links: [this.GenerateLink(from, to)]
      },
      actions: [{
        type: 'send',
        color: '#1acacd',
        marker: 'filecoin'
      }]
    }
  }

  GenerateLink (from, to) {
    return {source: from, target: to}
  }

  GenerateBroadcast (from) {
    const miners = this.miners.map(d => {
      return {source: from, target: d}
    })
    const clients = this.clients.map(d => {
      return {source: from, target: d}
    })
    return miners.concat(clients).filter(d => {
      return d.target.id !== from.id
    })
  }

  RandomMiner () {
    return this.miners[Math.floor(Math.random() * this.miners.length)]
  }

  RandomClient () {
    return this.clients[Math.floor(Math.random() * this.clients.length)]
  }

  get nodes () {
    return this.miners.concat(this.clients)
  }
}

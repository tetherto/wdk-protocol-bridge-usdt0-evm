import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import * as ethers from 'ethers'

import { WalletAccountEvm, WalletAccountReadOnlyEvm } from '@tetherto/wdk-wallet-evm'

import { WalletAccountEvmErc4337, WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337'

const SEED = 'cook voyage document eight skate token alien guide drink uncle term abuse'

const USER_ADDRESS = '0xa460AEbce0d3A4BecAd8ccf9D6D4861296c503Bd'

const TOKEN = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'

const APPROVAL_ADDRESS = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'

const MOCK_QUOTE = {
  transactionRequest: {
    to: APPROVAL_ADDRESS,
    data: '0xabcdef1234567890',
    value: '0x0',
    gasLimit: '0x493e0',
    gasPrice: '0x3b9aca00',
    chainId: 1
  },
  estimate: {
    approvalAddress: APPROVAL_ADDRESS,
    skipApproval: false,
    fromAmount: '1000000',
    fromAmountUSD: '1.00',
    toAmount: '999700',
    toAmountMin: '994700',
    toAmountUSD: '0.9997',
    executionDuration: 49,
    feeCosts: [
      {
        name: 'LIFI Fixed Fee',
        amount: '2300',
        amountUSD: '0.002',
        included: true
      }
    ],
    gasCosts: [
      {
        type: 'SEND',
        amount: '155728000000000',
        amountUSD: '0.41'
      }
    ]
  },
  action: {
    fromToken: { symbol: 'USDT', decimals: 6 },
    toToken: { symbol: 'USDT', decimals: 6 }
  },
  toolDetails: { name: 'Stargate' },
  tool: 'across'
}

const MOCK_STATUS = {
  transactionId: '0xabc123',
  status: 'DONE',
  substatus: 'COMPLETED',
  substatusMessage: 'The transfer is complete.',
  sending: {
    txHash: '0x1234567890abcdef'
  },
  receiving: {
    txHash: '0xfedcba0987654321'
  }
}

const getNetworkMock = jest.fn()

const waitForTransactionMock = jest.fn().mockResolvedValue({})

const allowanceMock = jest.fn()

jest.unstable_mockModule('ethers', () => ({
  ...ethers,
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getNetwork: getNetworkMock,
    waitForTransaction: waitForTransactionMock
  })),
  Contract: jest.fn().mockImplementation((target, abi, provider) => {
    const contract = new ethers.Contract(target, abi, provider)
    contract.allowance = allowanceMock
    return contract
  })
}))

const { LifiProtocolEvm } = await import('../index.js')

describe('LifiProtocolEvm', () => {
  describe('with WalletAccountEvm', () => {
    let account, protocol

    beforeEach(() => {
      account = new WalletAccountEvm(SEED, "0'/0/0", {
        provider: 'https://mock-rpc-url.com'
      })

      account.getAddress = jest.fn().mockResolvedValue(USER_ADDRESS)

      protocol = new LifiProtocolEvm(account)

      getNetworkMock.mockResolvedValue({ chainId: 1n })

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/token')) {
          return Promise.resolve({ ok: true, json: async () => ({ symbol: 'USDT' }) })
        }
        return Promise.resolve({ ok: true, json: async () => MOCK_QUOTE })
      })
    })

    describe('bridge', () => {
      beforeEach(() => {
        allowanceMock.mockResolvedValue(0n)

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-approve-hash' })
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash' })
      })

      test('should successfully bridge and return hash, approveHash, fee, and bridgeFee', async () => {
        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result).toEqual({
          hash: 'dummy-bridge-hash',
          approveHash: 'dummy-approve-hash',
          fee: 155_728_000_000_000n,
          bridgeFee: 2300n
        })
      })

      test('should call the LI.FI quote endpoint with the correct params', async () => {
        await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).toContain('https://li.quest/v1/quote')
        expect(fetchCall).toContain('fromChain=1')
        expect(fetchCall).toContain('toChain=42161')
        expect(fetchCall).toContain(`fromToken=${TOKEN}`)
        expect(fetchCall).toContain('fromAmount=1000000')
        // Must use the resolved symbol, not the raw source-chain address.
        // Passing the same contract address as toToken breaks cross-chain routing
        // because token addresses differ per chain (e.g. USDT on Arbitrum !== USDT on Optimism).
        expect(fetchCall).toContain('toToken=USDT')
        expect(fetchCall).not.toContain(`toToken=${TOKEN}`)
      })

      test('should pass the order param to the LI.FI quote endpoint when set', async () => {
        const ordered = new LifiProtocolEvm(account, { order: 'FASTEST' })

        await ordered.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).toContain('order=FASTEST')
      })

      test('should not include order param when not set', async () => {
        await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).not.toContain('order=')
      })

      test('should skip approval when skipApproval is true', async () => {
        global.fetch = jest.fn().mockImplementation((url) => {
          if (url.includes('/token')) {
            return Promise.resolve({ ok: true, json: async () => ({ symbol: 'USDT' }) })
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...MOCK_QUOTE,
              estimate: { ...MOCK_QUOTE.estimate, skipApproval: true }
            })
          })
        })

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash' })

        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result.hash).toBe('dummy-bridge-hash')
        expect(result.approveHash).toBeUndefined()
        expect(account.sendTransaction).toHaveBeenCalledTimes(1)
      })

      test('should skip approval when allowance is already sufficient', async () => {
        allowanceMock.mockResolvedValue(1_000_000n)

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash' })

        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result.hash).toBe('dummy-bridge-hash')
        expect(result.approveHash).toBeUndefined()
        expect(account.sendTransaction).toHaveBeenCalledTimes(1)
      })

      test('should reset allowance to zero before approving when a non-zero allowance exists', async () => {
        allowanceMock.mockResolvedValue(500n)

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-reset-hash' })
          .mockResolvedValueOnce({ hash: 'dummy-approve-hash' })
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash' })

        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result).toEqual({
          hash: 'dummy-bridge-hash',
          approveHash: 'dummy-approve-hash',
          resetAllowanceHash: 'dummy-reset-hash',
          fee: 155_728_000_000_000n,
          bridgeFee: 2300n
        })

        expect(account.sendTransaction).toHaveBeenCalledTimes(3)
      })

      test('should throw before executing when maxGasFee is exceeded', async () => {
        const cappedProtocol = new LifiProtocolEvm(account, { maxGasFee: 0n })

        await expect(cappedProtocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })).rejects.toThrow('Exceeded maximum gas fee for bridge operation.')

        expect(account.sendTransaction).not.toHaveBeenCalled()
      })

      test('should throw before executing when maxBridgeFee is exceeded', async () => {
        const cappedProtocol = new LifiProtocolEvm(account, { maxBridgeFee: 0n })

        await expect(cappedProtocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })).rejects.toThrow('Exceeded maximum bridge fee for bridge operation.')

        expect(account.sendTransaction).not.toHaveBeenCalled()
      })

      test('should exclude APPROVE-type gas costs from the returned fee', async () => {
        global.fetch = jest.fn().mockImplementation((url) => {
          if (url.includes('/token')) {
            return Promise.resolve({ ok: true, json: async () => ({ symbol: 'USDT' }) })
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...MOCK_QUOTE,
              estimate: {
                ...MOCK_QUOTE.estimate,
                gasCosts: [
                  { type: 'APPROVE', amount: '50000000000000', amountUSD: '0.13' },
                  { type: 'SEND',    amount: '155728000000000', amountUSD: '0.41' }
                ]
              }
            })
          })
        })

        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result.fee).toBe(155_728_000_000_000n)
      })

      test('should pass allowBridges to the LI.FI quote endpoint', async () => {
        const filteredProtocol = new LifiProtocolEvm(account, { allowBridges: ['stargate', 'cctp'] })

        await filteredProtocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).toContain('allowBridges=stargate%2Ccctp')
      })

      test('should pass denyBridges to the LI.FI quote endpoint', async () => {
        const filteredProtocol = new LifiProtocolEvm(account, { denyBridges: ['across', 'mayan'] })

        await filteredProtocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).toContain('denyBridges=across%2Cmayan')
      })

      test('should wait for approval confirmation before submitting the bridge transaction', async () => {
        const callOrder = []
        account.sendTransaction = jest.fn()
          .mockImplementationOnce(async () => { callOrder.push('approve'); return { hash: 'dummy-approve-hash' } })
          .mockImplementationOnce(async () => { callOrder.push('bridge'); return { hash: 'dummy-bridge-hash' } })
        waitForTransactionMock.mockImplementationOnce(async () => { callOrder.push('wait'); return {} })

        await protocol.bridge({ targetChain: 'arbitrum', recipient: USER_ADDRESS, token: TOKEN, amount: 1_000_000n })

        expect(callOrder).toEqual(['approve', 'wait', 'bridge'])
      })

      test('should throw for an unsupported target chain', async () => {
        await expect(protocol.bridge({
          targetChain: 'unsupported-chain',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })).rejects.toThrow("Target chain 'unsupported-chain' is not supported by the LI.FI bridge module.")
      })

      test('should accept a raw numeric chain ID and forward it directly to the LI.FI quote endpoint', async () => {
        await protocol.bridge({ targetChain: 8453, recipient: USER_ADDRESS, token: TOKEN, amount: 1_000_000n })
        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).toContain('toChain=8453')
      })

      test('should resolve a newly added chain name to its correct LI.FI chain ID', async () => {
        await protocol.bridge({ targetChain: 'sonic', recipient: USER_ADDRESS, token: TOKEN, amount: 1_000_000n })
        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).toContain('toChain=146')
      })

      test('should throw if the account is read-only', async () => {
        const readOnlyAccount = new WalletAccountReadOnlyEvm(USER_ADDRESS, {
          provider: 'https://mock-rpc-url.com'
        })

        const readOnlyProtocol = new LifiProtocolEvm(readOnlyAccount)

        await expect(readOnlyProtocol.bridge({}))
          .rejects.toThrow("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
      })

      test('should throw if the account is not connected to a provider', async () => {
        const unprovisionedAccount = new WalletAccountEvm(SEED, "0'/0/0")

        const unprovisionedProtocol = new LifiProtocolEvm(unprovisionedAccount)

        await expect(unprovisionedProtocol.bridge({}))
          .rejects.toThrow('The wallet must be connected to a provider in order to perform bridge operations.')
      })
    })

    describe('quoteBridge', () => {
      test('should return all route fields from the LI.FI quote', async () => {
        const result = await protocol.quoteBridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result).toMatchObject({
          fee: 155_728_000_000_000n,
          bridgeFee: 2300n,
          fromAmount: '1000000',
          toAmount: '999700',
          toAmountMin: '994700',
          fromAmountUSD: '1.00',
          toAmountUSD: '0.9997',
          gasCostUSD: '0.4100',
          executionDuration: 49,
          fromToken: { symbol: 'USDT', decimals: 6 },
          toToken: { symbol: 'USDT', decimals: 6 },
          tool: 'Stargate'
        })
      })

      test('should return zero fees and "0.0000" gasCostUSD when estimate arrays are empty', async () => {
        global.fetch = jest.fn().mockImplementation((url) => {
          if (url.includes('/token')) {
            return Promise.resolve({ ok: true, json: async () => ({ symbol: 'USDT' }) })
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...MOCK_QUOTE,
              estimate: { ...MOCK_QUOTE.estimate, feeCosts: [], gasCosts: [] }
            })
          })
        })

        const result = await protocol.quoteBridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result).toMatchObject({ fee: 0n, bridgeFee: 0n, gasCostUSD: '0.0000' })
      })

      test('should resolve the source token to its symbol before fetching the quote', async () => {
        await protocol.quoteBridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const tokenFetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/token'))[0]
        expect(tokenFetchCall).toContain('chain=1')
        expect(tokenFetchCall).toContain(`token=${TOKEN}`)

        const quoteFetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(quoteFetchCall).toContain('toToken=USDT')
      })

      test('should use an explicit toToken directly without calling the token resolution endpoint', async () => {
        const EXPLICIT_TO_TOKEN = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'

        await protocol.quoteBridge({
          targetChain: 'optimism',
          recipient: USER_ADDRESS,
          token: TOKEN,
          toToken: EXPLICIT_TO_TOKEN,
          amount: 1_000_000n
        })

        const tokenFetchCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/token'))
        expect(tokenFetchCalls).toHaveLength(0)

        const quoteFetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(quoteFetchCall).toContain(`toToken=${EXPLICIT_TO_TOKEN}`)
      })

      test('should accept a raw numeric chain ID', async () => {
        await protocol.quoteBridge({ targetChain: 8453, recipient: USER_ADDRESS, token: TOKEN, amount: 1_000_000n })
        const fetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(fetchCall).toContain('toChain=8453')
      })

      test('should throw when the token resolution endpoint returns a non-OK response', async () => {
        global.fetch = jest.fn().mockImplementation((url) => {
          if (url.includes('/token')) {
            return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' })
          }
          return Promise.resolve({ ok: true, json: async () => MOCK_QUOTE })
        })

        await expect(protocol.quoteBridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })).rejects.toThrow("Failed to resolve token symbol for")
      })

      test('should throw when the token resolution endpoint returns no symbol', async () => {
        global.fetch = jest.fn().mockImplementation((url) => {
          if (url.includes('/token')) {
            return Promise.resolve({ ok: true, json: async () => ({}) })
          }
          return Promise.resolve({ ok: true, json: async () => MOCK_QUOTE })
        })

        await expect(protocol.quoteBridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })).rejects.toThrow("LI.FI returned no symbol for token")
      })

      test('should accept a token symbol string as toToken without calling the resolution endpoint', async () => {
        await protocol.quoteBridge({
          targetChain: 'optimism',
          recipient: USER_ADDRESS,
          token: TOKEN,
          toToken: 'USDC',
          amount: 1_000_000n
        })

        const tokenFetchCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/token'))
        expect(tokenFetchCalls).toHaveLength(0)

        const quoteFetchCall = global.fetch.mock.calls.find(([url]) => url.includes('/quote'))[0]
        expect(quoteFetchCall).toContain('toToken=USDC')
      })

      test('should throw for an unsupported target chain', async () => {
        await expect(protocol.quoteBridge({
          targetChain: 'unsupported-chain',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })).rejects.toThrow("Target chain 'unsupported-chain' is not supported by the LI.FI bridge module.")
      })

      test('should throw if the account is not connected to a provider', async () => {
        const unprovisionedAccount = new WalletAccountEvm(SEED, "0'/0/0")

        const unprovisionedProtocol = new LifiProtocolEvm(unprovisionedAccount)

        await expect(unprovisionedProtocol.quoteBridge({}))
          .rejects.toThrow('The wallet must be connected to a provider in order to quote bridge operations.')
      })
    })

    describe('getStatus', () => {
      test('should return the status for a given transaction hash', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => MOCK_STATUS
        })

        const result = await protocol.getStatus('0xabc123', { fromChain: 1, toChain: 42_161 })

        expect(result.status).toBe('DONE')
        expect(result.substatus).toBe('COMPLETED')
        expect(result.substatusMessage).toBe('The transfer is complete.')
      })

      test('should include fromChain and toChain in the request when provided', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => MOCK_STATUS
        })

        await protocol.getStatus('0xabc123', { fromChain: 1, toChain: 42_161 })

        const fetchCall = global.fetch.mock.calls[0][0]
        expect(fetchCall).toContain('txHash=0xabc123')
        expect(fetchCall).toContain('fromChain=1')
        expect(fetchCall).toContain('toChain=42161')
      })

      test('should throw when the status request fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          statusText: 'Not Found',
          json: async () => ({ message: 'Transaction not found' })
        })

        await expect(protocol.getStatus('0xbad'))
          .rejects.toThrow('LI.FI status request failed: Transaction not found')
      })
    })
  })

  describe('with WalletAccountEvmErc4337', () => {
    let account, protocol

    beforeEach(() => {
      account = new WalletAccountEvmErc4337(SEED, "0'/0/0", {
        chainId: 1,
        provider: 'https://mock-rpc-url.com'
      })

      account.getAddress = jest.fn().mockResolvedValue(USER_ADDRESS)

      protocol = new LifiProtocolEvm(account)

      getNetworkMock.mockResolvedValue({ chainId: 1n })

      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/token')) {
          return Promise.resolve({ ok: true, json: async () => ({ symbol: 'USDT' }) })
        }
        return Promise.resolve({ ok: true, json: async () => MOCK_QUOTE })
      })
    })

    describe('bridge', () => {
      beforeEach(() => {
        allowanceMock.mockResolvedValue(0n)

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-approve-hash' })
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash' })
      })

      test('should wrap the approval transaction in an array for ERC-4337', async () => {
        await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const approveCall = account.sendTransaction.mock.calls[0][0]
        expect(Array.isArray(approveCall)).toBe(true)
      })

      test('should wrap the bridge transaction in an array for ERC-4337', async () => {
        await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        const bridgeCall = account.sendTransaction.mock.calls[1][0]
        expect(Array.isArray(bridgeCall)).toBe(true)
        expect(bridgeCall[0].to).toBe(APPROVAL_ADDRESS)
        expect(bridgeCall[0].data).toBe(MOCK_QUOTE.transactionRequest.data)
      })

      test('should throw when maxGasFee is exceeded', async () => {
        const cappedProtocol = new LifiProtocolEvm(account, { maxGasFee: 0n })

        await expect(cappedProtocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })).rejects.toThrow('Exceeded maximum gas fee for bridge operation.')
      })

      test('should allow maxGasFee override via the per-call config argument', async () => {
        await expect(protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        }, { maxGasFee: 0n })).rejects.toThrow('Exceeded maximum gas fee for bridge operation.')
      })

      test('should skip approval when skipApproval is true', async () => {
        global.fetch = jest.fn().mockImplementation((url) => {
          if (url.includes('/token')) {
            return Promise.resolve({ ok: true, json: async () => ({ symbol: 'USDT' }) })
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...MOCK_QUOTE,
              estimate: { ...MOCK_QUOTE.estimate, skipApproval: true }
            })
          })
        })

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash' })

        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result.hash).toBe('dummy-bridge-hash')
        expect(result.approveHash).toBeUndefined()
        expect(account.sendTransaction).toHaveBeenCalledTimes(1)
        const bridgeCall = account.sendTransaction.mock.calls[0][0]
        expect(Array.isArray(bridgeCall)).toBe(true)
      })

      test('should reset allowance to zero before approving when a non-zero allowance exists', async () => {
        allowanceMock.mockResolvedValue(500n)

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-reset-hash' })
          .mockResolvedValueOnce({ hash: 'dummy-approve-hash' })
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash' })

        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result.resetAllowanceHash).toBe('dummy-reset-hash')
        expect(result.approveHash).toBe('dummy-approve-hash')
        expect(result.hash).toBe('dummy-bridge-hash')
        expect(account.sendTransaction).toHaveBeenCalledTimes(3)

        const resetCall = account.sendTransaction.mock.calls[0][0]
        expect(Array.isArray(resetCall)).toBe(true)
        const approveCall = account.sendTransaction.mock.calls[1][0]
        expect(Array.isArray(approveCall)).toBe(true)
      })

      test('should throw if the account is read-only', async () => {
        const readOnlyAccount = new WalletAccountReadOnlyEvmErc4337(USER_ADDRESS, {
          chainId: 1,
          provider: 'https://mock-rpc-url.com'
        })

        const readOnlyProtocol = new LifiProtocolEvm(readOnlyAccount)

        await expect(readOnlyProtocol.bridge({}))
          .rejects.toThrow("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
      })

      test('should throw if the account is not connected to a provider', async () => {
        const unprovisionedAccount = new WalletAccountEvmErc4337(SEED, "0'/0/0", {
          chainId: 1
        })

        const unprovisionedProtocol = new LifiProtocolEvm(unprovisionedAccount)

        await expect(unprovisionedProtocol.bridge({}))
          .rejects.toThrow('The wallet must be connected to a provider in order to perform bridge operations.')
      })
    })

    describe('quoteBridge', () => {
      test('should return fee and bridgeFee', async () => {
        const result = await protocol.quoteBridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 1_000_000n
        })

        expect(result).toMatchObject({
          fee: 155_728_000_000_000n,
          bridgeFee: 2300n
        })
      })
    })
  })
})

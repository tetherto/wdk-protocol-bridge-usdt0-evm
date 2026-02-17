import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { addressToBytes32 } from '@layerzerolabs/lz-v2-utilities'

import * as ethers from 'ethers'

const { decodeBase58, zeroPadValue, toBeHex } = ethers

import { WalletAccountEvm, WalletAccountReadOnlyEvm } from '@tetherto/wdk-wallet-evm'

import { WalletAccountEvmErc4337, WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337'

import { Address } from '@ton/core'

import { TronWeb } from 'tronweb'

import { OFT_ABI, TRANSACTION_VALUE_HELPER_ABI } from '../src/abi.js'

const SEED = 'cook voyage document eight skate token alien guide drink uncle term abuse'

const USER_ADDRESS = '0xa460AEbce0d3A4BecAd8ccf9D6D4861296c503Bd'

const TOKEN = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'

const SOLANA_ADDRESS = 'HyXJcgYpURfDhgzuyRL7zxP4FhLg7LZQMeDrR4MXZcMN'

const TON_ADDRESS = 'EQAd31gAUhdO0d0NZsNb_cGl_Maa9PSuNhVLE9z8bBSjX6Gq'

const TRON_ADDRESS = 'TFG4wBaDQ8sHWWP1ACeSGnoNR6RRzevLPt'

const SEND_PARAM = {
  EVM: {
    dstEid: 30_110,
    to: addressToBytes32(USER_ADDRESS),
    amountLD: 100n,
    minAmountLD: 99n,
    extraOptions: new Uint8Array([0, 3]),
    composeMsg: new Uint8Array([ ]),
    oftCmd: new Uint8Array([ ])
  },
  ERC4337: {
    dstEid: 30_101,
    to: addressToBytes32(USER_ADDRESS),
    amountLD: 100n,
    minAmountLD: 99n,
    extraOptions: new Uint8Array([0, 3]),
    composeMsg: new Uint8Array([ ]),
    oftCmd: new Uint8Array([ ])
  },
  SOLANA: {
    dstEid: 30_168,
    to: zeroPadValue(toBeHex(decodeBase58(SOLANA_ADDRESS)), 32),
    amountLD: 100n,
    minAmountLD: 99n,
    extraOptions: new Uint8Array([0, 3]),
    composeMsg: new Uint8Array([ ]),
    oftCmd: new Uint8Array([ ])
  },
  TON: {
    dstEid: 30_343,
    to: '0x' + Address.parse(TON_ADDRESS).toRawString().slice(2),
    amountLD: 100n,
    minAmountLD: 99n,
    extraOptions: new Uint8Array([0, 3]),
    composeMsg: new Uint8Array([ ]),
    oftCmd: new Uint8Array([ ])
  },
  TRON: {
    dstEid: 30_420,
    to: addressToBytes32('0x' + TronWeb.address.toHex(TRON_ADDRESS)),
    amountLD: 100n,
    minAmountLD: 99n,
    extraOptions: new Uint8Array([0, 3]),
    composeMsg: new Uint8Array([ ]),
    oftCmd: new Uint8Array([ ])
  }
}

const BRIDGE_TRANSACTION = {
  EVM: {
    to: '0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee',
    value: 10_000n,
    data: '0xc7c7f5b3000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a460aebce0d3a4becad8ccf9d6d4861296c503bd000000000000000000000000000000000000000000000000000000000000759e000000000000000000000000a460aebce0d3a4becad8ccf9d6d4861296c503bd0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006300000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000002000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  },
  SOLANA: {
    to: '0x1F748c76dE468e9D11bd340fA9D5CBADf315dFB0',
    value: 10_000n,
    data: '0xc7c7f5b3000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a460aebce0d3a4becad8ccf9d6d4861296c503bd00000000000000000000000000000000000000000000000000000000000075d8fc35c7d850a775913767c2f2e08e606f11635473ee9100dda1c4e81aa35d89a90000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006300000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000002000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  },
  TON: {
    to: '0x1F748c76dE468e9D11bd340fA9D5CBADf315dFB0',
    value: 10_000n,
    data: '0xc7c7f5b3000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a460aebce0d3a4becad8ccf9d6d4861296c503bd00000000000000000000000000000000000000000000000000000000000076871ddf580052174ed1dd0d66c35bfdc1a5fcc69af4f4ae36154b13dcfc6c14a35f0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006300000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000002000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  },
  TRON: {
    to: '0x1F748c76dE468e9D11bd340fA9D5CBADf315dFB0',
    value: 10_000n,
    data: '0xc7c7f5b3000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a460aebce0d3a4becad8ccf9d6d4861296c503bd00000000000000000000000000000000000000000000000000000000000076d40000000000000000000000413a08f76772e200653bb55c2a92998daca62e0e970000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006300000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000002000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  },
  ERC4337: {
    to: '0xa90f03c856D01F698E7071B393387cd75a8a319A',
    value: 0,
    data: '0x11bbdd1400000000000000000000000014e4a1b13bf7f943c8ff7c51fb60fa964a298d920000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000138800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007595000000000000000000000000a460aebce0d3a4becad8ccf9d6d4861296c503bd0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006300000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000002000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  }
}

const getNetworkMock = jest.fn()

const tokenMock = jest.fn()

const quoteSendMock = jest.fn()

jest.unstable_mockModule('ethers', () => ({
  ...ethers,
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getNetwork: getNetworkMock
  })),
  Contract: jest.fn().mockImplementation((target, abi, provider) => {
    const contract = new ethers.Contract(target, abi, provider)

    if (abi === OFT_ABI || abi === TRANSACTION_VALUE_HELPER_ABI) {
      contract.token = tokenMock

      contract.quoteSend = quoteSendMock
    }

    return contract
  })
}))

const { default: Usdt0ProtocolEvm } = await import('../index.js')

describe('Usdt0ProtocolEvm', () => {
  let account,
      protocol

  describe('with WalletAccountEvm', () => {
    beforeEach(() => {
      account = new WalletAccountEvm(SEED, "0'/0/0", {
        provider: 'https://mock-rpc-url.com'
      })

      account.getAddress = jest.fn().mockResolvedValue(USER_ADDRESS)

      protocol = new Usdt0ProtocolEvm(account)

      getNetworkMock.mockResolvedValue({ chainId: 1n })
    })

    describe('bridge', () => {
      beforeEach(() => {
        tokenMock.mockResolvedValue(TOKEN)

        quoteSendMock.mockResolvedValue({ nativeFee: 10_000n })

        account.quoteSendTransaction = jest.fn()
          .mockResolvedValueOnce({ fee: 12_345n })

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-bridge-hash', fee: 12_345n })
      })

      test('should successfully perform a bridge operation', async () => {
        const result = await protocol.bridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.EVM, false)

        expect(account.quoteSendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.EVM)

        expect(account.sendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.EVM)

        expect(result).toEqual({
          hash: 'dummy-bridge-hash',
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })

      test('should throw if the bridge fee exceeds the bridge max fee configuration', async () => {
        const OPTIONS = {
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 100
        }

        const protocol = new Usdt0ProtocolEvm(account, {
          bridgeMaxFee: 0
        })

        await expect(protocol.bridge(OPTIONS))
          .rejects.toThrow('Exceeded maximum fee cost for bridge operation.')
      })

      test('should throw if the account is read-only', async () => {
        const account = new WalletAccountReadOnlyEvm(USER_ADDRESS, {
          provider: 'https://mock-rpc-url.com'
        })

        const protocol = new Usdt0ProtocolEvm(account)

        await expect(protocol.bridge({ }))
          .rejects.toThrow("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
      })

      test('should throw if the account is not connected to a provider', async () => {
        const account = new WalletAccountEvm(SEED, "0'/0/0")

        const protocol = new Usdt0ProtocolEvm(account)

        await expect(protocol.bridge({ }))
          .rejects.toThrow('The wallet must be connected to a provider in order to perform bridge operations.')
      })

      test('should successfully bridge to solana', async () => {
        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-solana-bridge-hash', fee: 12_345n })

        const result = await protocol.bridge({
          targetChain: 'solana',
          recipient: SOLANA_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.SOLANA, false)

        expect(account.quoteSendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.SOLANA)

        expect(account.sendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.SOLANA)

        expect(result).toEqual({
          hash: 'dummy-solana-bridge-hash',
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })

      test('should successfully bridge to ton', async () => {
        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-ton-bridge-hash', fee: 12_345n })

        const result = await protocol.bridge({
          targetChain: 'ton',
          recipient: TON_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.TON, false)

        expect(account.quoteSendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.TON)

        expect(account.sendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.TON)

        expect(result).toEqual({
          hash: 'dummy-ton-bridge-hash',
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })

      test('should successfully bridge to tron', async () => {
        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-tron-bridge-hash', fee: 12_345n })

        const result = await protocol.bridge({
          targetChain: 'tron',
          recipient: TRON_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.TRON, false)

        expect(account.quoteSendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.TRON)

        expect(account.sendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.TRON)

        expect(result).toEqual({
          hash: 'dummy-tron-bridge-hash',
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })
    })

    describe('quoteBridge', () => {
      beforeEach(() => {
        tokenMock.mockResolvedValue(TOKEN)

        quoteSendMock.mockResolvedValue({ nativeFee: 10_000n })

        account.quoteSendTransaction = jest.fn()
          .mockResolvedValueOnce({ fee: 12_345n })
      })

      test('should successfully quote a bridge operation', async () => {
        const result = await protocol.quoteBridge({
          targetChain: 'arbitrum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.EVM, false)

        expect(account.quoteSendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.EVM)

        expect(result).toEqual({
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })

      test('should throw if the account is not connected to a provider', async () => {
        const account = new WalletAccountEvm(SEED, "0'/0/0")

        const protocol = new Usdt0ProtocolEvm(account)

        await expect(protocol.quoteBridge({ }))
          .rejects.toThrow('The wallet must be connected to a provider in order to quote bridge operations.')
      })

      test('should successfully quote a bridge to solana', async () => {
        const result = await protocol.quoteBridge({
          targetChain: 'solana',
          recipient: SOLANA_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.SOLANA, false)

        expect(account.quoteSendTransaction).toHaveBeenCalledWith(BRIDGE_TRANSACTION.SOLANA)

        expect(result).toEqual({
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })
    })
  })

  describe('with WalletAccountEvmErc4337', () => {
    beforeEach(() => {
      account = new WalletAccountEvmErc4337(SEED, "0'/0/0", {
        chainId: 42_161,
        provider: 'https://mock-rpc-url.com'
      })

      account.getAddress = jest.fn().mockResolvedValue(USER_ADDRESS)

      protocol = new Usdt0ProtocolEvm(account)

      getNetworkMock.mockResolvedValue({ chainId: 42_161n })
    })

    describe('bridge', () => {
      beforeEach(() => {
        tokenMock.mockResolvedValue(TOKEN)

        quoteSendMock
          .mockResolvedValueOnce({ nativeFee: 5_000n, lzTokenFee: 0n })
          .mockResolvedValueOnce(10_000n)

        account.quoteSendTransaction = jest.fn()
          .mockResolvedValueOnce({ fee: 12_345n })

        account.sendTransaction = jest.fn()
          .mockResolvedValueOnce({ hash: 'dummy-user-operation-hash', fee: 12_345n })
      })

      test('should successfully perform a bridge operation', async () => {
        const result = await protocol.bridge({
          targetChain: 'ethereum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.ERC4337, false)
        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.ERC4337, [5_000n, 0n])

        expect(account.quoteSendTransaction).toHaveBeenCalledWith([BRIDGE_TRANSACTION.ERC4337], undefined)

        expect(account.sendTransaction).toHaveBeenCalledWith([BRIDGE_TRANSACTION.ERC4337], undefined)

        expect(result).toEqual({
          hash: 'dummy-user-operation-hash',
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })

      test('should throw if the bridge fee exceeds the bridge max fee configuration', async () => {
        const OPTIONS = {
          targetChain: 'ethereum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 100
        }

        const protocol = new Usdt0ProtocolEvm(account, {
          bridgeMaxFee: 0
        })

        await expect(protocol.bridge(OPTIONS))
          .rejects.toThrow('Exceeded maximum fee cost for bridge operation.')
      })

      test('should throw if the account is read-only', async () => {
        const account = new WalletAccountReadOnlyEvmErc4337(USER_ADDRESS, {
          chainId: 42_161,
          provider: 'https://mock-rpc-url.com'
        })

        const protocol = new Usdt0ProtocolEvm(account)

        await expect(protocol.bridge({ }))
          .rejects.toThrow("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
      })

      test('should throw if the account is not connected to a provider', async () => {
        const account = new WalletAccountEvmErc4337(SEED, "0'/0/0", {
          chainId: 42_161
        })

        const protocol = new Usdt0ProtocolEvm(account)

        await expect(protocol.bridge({ }))
          .rejects.toThrow('The wallet must be connected to a provider in order to perform bridge operations.')
      })
    })

    describe('quoteBridge', () => {
      beforeEach(() => {
        tokenMock.mockResolvedValue(TOKEN)

        quoteSendMock
          .mockResolvedValue({ nativeFee: 5_000n, lzTokenFee: 0n })
          .mockResolvedValue(10_000n)

        account.quoteSendTransaction = jest.fn()
          .mockResolvedValueOnce({ fee: 12_345n })
      })

      test('should successfully quote a bridge operation', async () => {
        const result = await protocol.quoteBridge({
          targetChain: 'ethereum',
          recipient: USER_ADDRESS,
          token: TOKEN,
          amount: 100
        })

        expect(tokenMock).toHaveBeenCalled()

        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.ERC4337, false)
        expect(quoteSendMock).toHaveBeenCalledWith(SEND_PARAM.ERC4337, [5_000n, 0n])

        expect(account.quoteSendTransaction).toHaveBeenCalledWith([BRIDGE_TRANSACTION.ERC4337], undefined)

        expect(result).toEqual({
          fee: 12_345n,
          bridgeFee: 10_000n
        })
      })

      test('should throw if the account is not connected to a provider', async () => {
        const account = new WalletAccountEvmErc4337(SEED, "0'/0/0", {
          chainId: 42_161
        })

        const protocol = new Usdt0ProtocolEvm(account)

        await expect(protocol.quoteBridge({ }))
          .rejects.toThrow('The wallet must be connected to a provider in order to quote bridge operations.')
      })
    })
  })
})

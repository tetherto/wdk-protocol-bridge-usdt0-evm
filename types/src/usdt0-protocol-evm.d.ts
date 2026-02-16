export default class Usdt0ProtocolEvm extends BridgeProtocol {
    /**
     * Creates a new read-only interface to the usdt0 protocol for evm blockchains.
     *
     * @overload
     * @param {WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337} account - The wallet account to use to interact with the protocol.
     * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337, config?: BridgeProtocolConfig);
    /**
     * Creates a new interface to the usdt0 protocol for evm blockchains.
     *
     * @overload
     * @param {WalletAccountEvm | WalletAccountEvmErc4337} account - The wallet account to use to interact with the protocol.
     * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: WalletAccountEvm | WalletAccountEvmErc4337, config?: BridgeProtocolConfig);
    /** @private */
    private _chainId;
    /** @private */
    private _provider;
    /**
     * Bridges a token to a different blockchain.
     *
     * Users must first approve the necessary amount of tokens to the usdt0 protocol using the {@link WalletAccountEvm#approve} or the {@link WalletAccountEvmErc4337#approve} method.
     *
     * @param {EvmBridgeOptions} options - The bridge's options.
     * @param {EvmBridgeConfig} [config] - If the protocol has been initialized with an erc-4337 wallet account, overrides the
     *   'paymasterToken' option defined in its configuration and the 'bridgeMaxFee' option defined in the protocol configuration.
     * @returns {Promise<BridgeResult>} The bridge's result.
     */
    bridge(options: EvmBridgeOptions, config?: EvmBridgeConfig): Promise<BridgeResult>;
    /**
     * Quotes the costs of a bridge operation.
     *
     * Users must first approve the necessary amount of tokens to the usdt0 protocol using the {@link WalletAccountEvm#approve} or the {@link WalletAccountEvmErc4337#approve} method.
     *
     * @param {EvmBridgeOptions} options - The bridge's options.
     * @param {Omit<EvmBridgeConfig, 'bridgeMaxFee'>} [config] - If the protocol has been initialized with an erc-4337
     *   wallet account, overrides the 'paymasterToken' option defined in its configuration.
     * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
     */
    quoteBridge(options: EvmBridgeOptions, config?: Omit<EvmBridgeConfig, "bridgeMaxFee">): Promise<Omit<BridgeResult, "hash">>;
    /** @private */
    private _getChainId;
    /** @private */
    private _getBridgeTransactions;
    /** @private */
    private _getOftContract;
    /** @private */
    private _getSourceChainConfiguration;
    /** @private */
    private _buildOftSendParam;
    /** @private */
    private _getTransactionValueHelperContract;
}
export type BridgeProtocolConfig = import("@tetherto/wdk-wallet/protocols").BridgeProtocolConfig;
export type BridgeResult = import("@tetherto/wdk-wallet/protocols").BridgeResult;
export type BridgeOptions = import("@tetherto/wdk-wallet/protocols").BridgeOptions;
export type WalletAccountReadOnlyEvm = import("@tetherto/wdk-wallet-evm").WalletAccountReadOnlyEvm;
export type EvmErc4337WalletConfig = import("@tetherto/wdk-wallet-evm-erc-4337").EvmErc4337WalletConfig;
export type EvmBridgeOptions = {
    /**
     * - The identifier of the destination blockchain (e.g., "arbitrum").
     */
    targetChain: string;
    /**
     * - The address of the recipient.
     */
    recipient: string;
    /**
     * - The address of the token to bridge.
     */
    token: string;
    /**
     * - The amount of tokens to bridge to the destination chain (in base unit).
     */
    amount: number | bigint;
    /**
     * - Custom OFT contract address to use instead of auto-resolving from the source chain.
     */
    oftContractAddress?: string;
    /**
     * - Custom LayerZero destination endpoint ID to override the default for the target chain.
     */
    dstEid?: number;
};
export type EvmBridgeConfig = {
    /**
     * - The paymaster token configuration.
     */
    paymasterToken?: {
        address: string;
    };
    /**
     * - The maximum fee amount for bridge operations.
     */
    bridgeMaxFee?: number | bigint;
};
import { BridgeProtocol } from '@tetherto/wdk-wallet/protocols';
import { WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { WalletAccountEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';

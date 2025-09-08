import { BaseProvider } from "@ethersproject/providers";
import {
  downloadContractsBlob,
  ContractsBlob,
} from "@generationsoftware/pt-v5-utils-js";
import {
  getProvider,
  instantiateRelayerAccount,
  loadLiquidatorEnvVars,
  runLiquidator,
  LiquidatorEnvVars,
  LiquidatorConfig,
  RelayerAccount,
} from "@generationsoftware/pt-v5-autotasks-library";

const main = async () => {
  // Load environment variables
  const envVars: LiquidatorEnvVars = loadLiquidatorEnvVars();
  
  // Since Covalent API is defunct, we'll let the library use DexScreener and CoinGecko
  // which are still functional fallbacks in the pt-v5-autotasks-library
  const ankrApiKey = process.env.ANKR_API_KEY;
  if (ankrApiKey) {
    console.log('🔧 Ankr API key available for future price fetching enhancements');
    console.log('📊 Current setup: Library will use DexScreener → CoinGecko fallback chain');
    console.log('✅ Covalent API dependency bypassed successfully');
  } else {
    console.log('📊 Using DexScreener → CoinGecko price fallback (Covalent bypassed)');
  }
  
  // Don't pass the defunct Covalent API key to avoid failed API calls
  // The library will automatically fall back to working price sources

  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY
  );

  const config: LiquidatorConfig = {
    ...relayerAccount,
    provider,
    // Don't pass covalentApiKey to avoid defunct API calls
    // Library will use DexScreener → CoinGecko fallback automatically
    covalentApiKey: undefined,
    chainId: envVars.CHAIN_ID,
    swapRecipient: envVars.SWAP_RECIPIENT,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
    envTokenAllowList: envVars.ENV_TOKEN_ALLOW_LIST,
    claimRewards: envVars.CLAIM_REWARDS,
    pairsToLiquidate: envVars.PAIRS_TO_LIQUIDATE,
    contractJsonUrl: envVars.CONTRACT_JSON_URL,
  };

  const contracts: ContractsBlob = await downloadContractsBlob(
    config.contractJsonUrl
  );
  await runLiquidator(contracts, config);
};

main();

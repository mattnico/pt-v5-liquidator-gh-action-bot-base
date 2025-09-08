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

// Import and apply Ankr patch
import { applyAnkrPatch, setAnkrApiKey } from "./src/utils/libraryPatch";

const main = async () => {
  // Load environment variables
  const envVars: LiquidatorEnvVars = loadLiquidatorEnvVars();
  
  // Apply Ankr patch to replace Covalent API with Ankr API
  console.log('🔧 Applying Ankr API patch to replace Covalent...');
  await applyAnkrPatch();
  
  // Set the Ankr API key for the patched functions
  const ankrApiKey = process.env.ANKR_API_KEY;
  if (ankrApiKey) {
    setAnkrApiKey(ankrApiKey);
    console.log('✅ Ankr API key configured successfully');
  } else {
    console.warn('⚠️  No ANKR_API_KEY found. Price fetching may fall back to other sources.');
  }

  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY
  );

  const config: LiquidatorConfig = {
    ...relayerAccount,
    provider,
    covalentApiKey: ankrApiKey || envVars.COVALENT_API_KEY, // Use Ankr key but keep field name for compatibility
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

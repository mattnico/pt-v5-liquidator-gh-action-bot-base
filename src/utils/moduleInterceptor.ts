// Module interceptor to replace Covalent API calls with Ankr API calls
import { getAnkrMarketRateUsd, getAnkrNativeTokenMarketRateUsd } from './ankrPriceFetcher';

let ankrApiKey: string | undefined;

export const setAnkrApiKey = (apiKey: string) => {
  ankrApiKey = apiKey;
};

// Custom implementation of getEthMainnetTokenMarketRateUsd that uses Ankr instead of Covalent
export const getEthMainnetTokenMarketRateUsdWithAnkr = async (
  chainId: number,
  symbol: string,
  tokenAddress: string,
  originalCovalentApiKey?: string
) => {
  console.log(`🔍 Fetching price for ${symbol} on chain ${chainId}`);
  
  // Import the original library functions
  const getUsdModule = await import('@generationsoftware/pt-v5-autotasks-library/dist/utils/getUsd.js');
  
  // Try DexScreener first (as in original library)
  let marketRateUsd;
  try {
    marketRateUsd = await getUsdModule.getDexscreenerMarketRateUsd(tokenAddress);
    if (marketRateUsd) {
      console.log(`✅ Got price from DexScreener: $${marketRateUsd}`);
      return marketRateUsd;
    }
  } catch (err) {
    console.log('DexScreener failed, trying Ankr...');
  }
  
  // If DexScreener fails, try Ankr instead of Covalent
  if (!marketRateUsd && ankrApiKey && tokenAddress) {
    try {
      marketRateUsd = await getAnkrMarketRateUsd(chainId, tokenAddress, ankrApiKey);
      if (marketRateUsd) {
        console.log(`✅ Got price from Ankr API: $${marketRateUsd}`);
        return marketRateUsd;
      }
    } catch (err) {
      console.warn('Ankr API failed:', err);
    }
  }
  
  // If both fail, try CoinGecko as final fallback
  if (!marketRateUsd) {
    try {
      marketRateUsd = await getUsdModule.getCoingeckoMarketRateUsd(symbol);
      if (marketRateUsd) {
        console.log(`✅ Got price from CoinGecko: $${marketRateUsd}`);
        return marketRateUsd;
      }
    } catch (err) {
      console.warn('CoinGecko API also failed:', err);
    }
  }
  
  console.warn(`❌ Could not fetch price for ${symbol} from any source`);
  return marketRateUsd;
};

// Custom implementation of getNativeTokenMarketRateUsd using Ankr
export const getNativeTokenMarketRateUsdWithAnkr = async (
  chainId: number,
  originalCovalentApiKey?: string
) => {
  console.log(`🔍 Fetching native token price for chain ${chainId}`);
  
  if (ankrApiKey) {
    try {
      const price = await getAnkrNativeTokenMarketRateUsd(chainId, ankrApiKey);
      if (price) {
        console.log(`✅ Got native token price from Ankr: $${price}`);
        return price;
      }
    } catch (err) {
      console.warn('Ankr native token pricing failed:', err);
    }
  }
  
  // Fallback to original implementation
  const getUsdModule = await import('@generationsoftware/pt-v5-autotasks-library/dist/utils/getUsd.js');
  return await getUsdModule.getNativeTokenMarketRateUsd(chainId, originalCovalentApiKey);
};
import { getAnkrMarketRateUsd, getAnkrNativeTokenMarketRateUsd } from './ankrPriceFetcher';

// This module patches the pt-v5-autotasks-library to replace Covalent API with Ankr API

let ankrApiKey: string | undefined;

export const setAnkrApiKey = (apiKey: string) => {
  ankrApiKey = apiKey;
};

// Replacement function for getCovalentMarketRateUsd
export const patchedGetMarketRateUsd = async (
  chainId: number,
  tokenAddress: string,
  _covalentApiKey?: string
): Promise<number | undefined> => {
  if (!ankrApiKey) {
    console.warn('Ankr API key not set. Please call setAnkrApiKey() first.');
    return undefined;
  }
  
  return await getAnkrMarketRateUsd(chainId, tokenAddress, ankrApiKey);
};

// Replacement function for getNativeTokenMarketRateUsd
export const patchedGetNativeTokenMarketRateUsd = async (
  chainId: number,
  _covalentApiKey?: string
): Promise<number | undefined> => {
  if (!ankrApiKey) {
    console.warn('Ankr API key not set. Please call setAnkrApiKey() first.');
    return undefined;
  }
  
  return await getAnkrNativeTokenMarketRateUsd(chainId, ankrApiKey);
};

// Apply the patch to the loaded library
export const applyAnkrPatch = async () => {
  try {
    // Import the library module using dynamic import
    const getUsdModule = await import('@generationsoftware/pt-v5-autotasks-library/dist/utils/getUsd.js');
    
    // Replace the Covalent functions with Ankr versions
    if (getUsdModule.getCovalentMarketRateUsd) {
      getUsdModule.getCovalentMarketRateUsd = patchedGetMarketRateUsd;
      console.log('✅ Successfully patched getCovalentMarketRateUsd with Ankr implementation');
    }
    
    if (getUsdModule.getNativeTokenMarketRateUsd) {
      const originalGetNativeTokenMarketRateUsd = getUsdModule.getNativeTokenMarketRateUsd;
      getUsdModule.getNativeTokenMarketRateUsd = async (chainId: number, _covalentApiKey?: string) => {
        // First try Ankr for native token pricing
        const ankrPrice = await patchedGetNativeTokenMarketRateUsd(chainId, _covalentApiKey);
        if (ankrPrice !== undefined) {
          return ankrPrice;
        }
        
        // Fallback to original implementation if Ankr fails
        return originalGetNativeTokenMarketRateUsd(chainId, _covalentApiKey);
      };
      console.log('✅ Successfully patched getNativeTokenMarketRateUsd with Ankr implementation');
    }
    
    // Also patch the main getEthMainnetTokenMarketRateUsd function
    if (getUsdModule.getEthMainnetTokenMarketRateUsd) {
      const originalGetEthMainnetTokenMarketRateUsd = getUsdModule.getEthMainnetTokenMarketRateUsd;
      getUsdModule.getEthMainnetTokenMarketRateUsd = async (
        chainId: number,
        symbol: string,
        tokenAddress: string,
        _covalentApiKey?: string
      ) => {
        // Try DexScreener first (as in original)
        let marketRateUsd;
        try {
          marketRateUsd = await getUsdModule.getDexscreenerMarketRateUsd(tokenAddress);
        } catch (err) {
          // Ignore DexScreener errors
        }
        
        // If DexScreener fails, try Ankr instead of Covalent
        if (!marketRateUsd && ankrApiKey && tokenAddress) {
          try {
            marketRateUsd = await getAnkrMarketRateUsd(chainId, tokenAddress, ankrApiKey);
          } catch (err) {
            console.warn('Ankr API failed:', err);
          }
        }
        
        // If both fail, try CoinGecko as final fallback
        if (!marketRateUsd) {
          try {
            marketRateUsd = await getUsdModule.getCoingeckoMarketRateUsd(symbol);
          } catch (err) {
            console.warn('CoinGecko API failed:', err);
          }
        }
        
        return marketRateUsd;
      };
      console.log('✅ Successfully patched getEthMainnetTokenMarketRateUsd with Ankr implementation');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply Ankr patch:', error);
    throw new Error('Failed to patch pt-v5-autotasks-library with Ankr implementation');
  }
};
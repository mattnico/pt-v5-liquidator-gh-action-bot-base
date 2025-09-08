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

// Store original functions for patching
let originalFunctions: any = {};
let isPatched = false;

// Apply the patch to the loaded library using a different approach
export const applyAnkrPatch = async () => {
  try {
    // Since ES modules are read-only, we'll use a different approach
    // We'll store the original functions and create a global replacement registry
    
    console.log('✅ Ankr patch system initialized (ES module compatible)');
    isPatched = true;
    
  } catch (error) {
    console.error('❌ Failed to apply Ankr patch:', error);
    throw new Error('Failed to patch pt-v5-autotasks-library with Ankr implementation');
  }
};

// Create wrapper functions that can be used instead of direct patching
export const getCovalentMarketRateUsdWrapper = async (
  chainId: number,
  tokenAddress: string,
  covalentApiKey?: string
): Promise<number | undefined> => {
  if (isPatched && ankrApiKey) {
    return await patchedGetMarketRateUsd(chainId, tokenAddress, covalentApiKey);
  }
  
  // Fallback to original if not patched or no Ankr key
  const getUsdModule = await import('@generationsoftware/pt-v5-autotasks-library/dist/utils/getUsd.js');
  return await getUsdModule.getCovalentMarketRateUsd(chainId, tokenAddress, covalentApiKey);
};

export const getNativeTokenMarketRateUsdWrapper = async (
  chainId: number,
  covalentApiKey?: string
): Promise<number | undefined> => {
  if (isPatched && ankrApiKey) {
    const ankrPrice = await patchedGetNativeTokenMarketRateUsd(chainId, covalentApiKey);
    if (ankrPrice !== undefined) {
      return ankrPrice;
    }
  }
  
  // Fallback to original
  const getUsdModule = await import('@generationsoftware/pt-v5-autotasks-library/dist/utils/getUsd.js');
  return await getUsdModule.getNativeTokenMarketRateUsd(chainId, covalentApiKey);
};

export const getEthMainnetTokenMarketRateUsdWrapper = async (
  chainId: number,
  symbol: string,
  tokenAddress: string,
  covalentApiKey?: string
): Promise<number | undefined> => {
  const getUsdModule = await import('@generationsoftware/pt-v5-autotasks-library/dist/utils/getUsd.js');
  
  // Try DexScreener first (as in original)
  let marketRateUsd;
  try {
    marketRateUsd = await getUsdModule.getDexscreenerMarketRateUsd(tokenAddress);
  } catch (err) {
    // Ignore DexScreener errors
  }
  
  // If DexScreener fails, try Ankr instead of Covalent (if patched)
  if (!marketRateUsd && isPatched && ankrApiKey && tokenAddress) {
    try {
      marketRateUsd = await getAnkrMarketRateUsd(chainId, tokenAddress, ankrApiKey);
      console.log('✅ Used Ankr API for token price');
    } catch (err) {
      console.warn('Ankr API failed, falling back:', err);
    }
  }
  
  // If still no price and we have original Covalent, try that
  if (!marketRateUsd && !isPatched && covalentApiKey && tokenAddress) {
    try {
      marketRateUsd = await getUsdModule.getCovalentMarketRateUsd(chainId, tokenAddress, covalentApiKey);
    } catch (err) {
      console.warn('Covalent API failed:', err);
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
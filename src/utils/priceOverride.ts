// Price fetching override that replaces Covalent with Ankr
import { Module } from 'module';
import { getAnkrMarketRateUsd, getAnkrNativeTokenMarketRateUsd } from './ankrPriceFetcher';

let ankrApiKey: string | undefined;

export const setAnkrApiKey = (apiKey: string) => {
  ankrApiKey = apiKey;
};

// Store original require function
const originalRequire = Module.prototype.require;

// Override the require function to intercept the getUsd module
export const setupPriceOverride = () => {
  console.log('🔧 Setting up price API override...');
  
  Module.prototype.require = function(id: string) {
    // Intercept the getUsd module
    if (id.includes('pt-v5-autotasks-library') && id.includes('getUsd')) {
      console.log('🎯 Intercepting price module, applying Ankr override...');
      
      // Get the original module
      const originalModule = originalRequire.call(this, id);
      
      // Create a proxy to override specific functions
      return new Proxy(originalModule, {
        get(target, prop, receiver) {
          if (prop === 'getCovalentMarketRateUsd' && ankrApiKey) {
            return async (chainId: number, tokenAddress: string, _covalentApiKey?: string) => {
              console.log(`📊 Using Ankr API for token price on chain ${chainId}`);
              return await getAnkrMarketRateUsd(chainId, tokenAddress, ankrApiKey);
            };
          }
          
          if (prop === 'getNativeTokenMarketRateUsd' && ankrApiKey) {
            return async (chainId: number, _covalentApiKey?: string) => {
              console.log(`📊 Using Ankr API for native token price on chain ${chainId}`);
              return await getAnkrNativeTokenMarketRateUsd(chainId, ankrApiKey);
            };
          }
          
          if (prop === 'getEthMainnetTokenMarketRateUsd' && ankrApiKey) {
            return async (chainId: number, symbol: string, tokenAddress: string, _covalentApiKey?: string) => {
              // Try DexScreener first
              let marketRateUsd;
              try {
                marketRateUsd = await target.getDexscreenerMarketRateUsd(tokenAddress);
                if (marketRateUsd) {
                  console.log(`✅ Got price from DexScreener: $${marketRateUsd}`);
                  return marketRateUsd;
                }
              } catch (err) {
                console.log('DexScreener failed, trying Ankr...');
              }
              
              // Try Ankr instead of Covalent
              if (!marketRateUsd && tokenAddress) {
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
              
              // Fallback to CoinGecko
              if (!marketRateUsd) {
                try {
                  marketRateUsd = await target.getCoingeckoMarketRateUsd(symbol);
                  if (marketRateUsd) {
                    console.log(`✅ Got price from CoinGecko: $${marketRateUsd}`);
                    return marketRateUsd;
                  }
                } catch (err) {
                  console.warn('CoinGecko API also failed:', err);
                }
              }
              
              return marketRateUsd;
            };
          }
          
          return Reflect.get(target, prop, receiver);
        }
      });
    }
    
    // For all other modules, use original require
    return originalRequire.call(this, id);
  };
  
  console.log('✅ Price override setup complete');
};

export const restoreOriginalRequire = () => {
  Module.prototype.require = originalRequire;
  console.log('🔄 Restored original require function');
};
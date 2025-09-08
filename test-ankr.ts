// Test script to verify Ankr API integration
import { getAnkrMarketRateUsd, getAnkrNativeTokenMarketRateUsd } from './src/utils/ankrPriceFetcher';

const testAnkrIntegration = async () => {
  console.log('🧪 Testing Ankr API integration...');
  
  // Note: This test would need a real ANKR_API_KEY to work
  const testApiKey = process.env.ANKR_API_KEY || 'test-key';
  
  try {
    console.log('Testing ETH price on Ethereum mainnet...');
    const ethPrice = await getAnkrNativeTokenMarketRateUsd(1, testApiKey);
    console.log('ETH price:', ethPrice ? `$${ethPrice}` : 'Not available');
    
    console.log('Testing WETH price on Ethereum mainnet...');
    const wethPrice = await getAnkrMarketRateUsd(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', testApiKey);
    console.log('WETH price:', wethPrice ? `$${wethPrice}` : 'Not available');
    
    console.log('✅ Ankr integration test completed');
  } catch (error) {
    console.error('❌ Error testing Ankr integration:', error);
  }
};

// Only run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAnkrIntegration();
}
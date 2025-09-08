import fetch from 'node-fetch';

const ANKR_API_URL = 'https://rpc.ankr.com/multichain';

// Chain ID to Ankr blockchain name mapping
const CHAIN_ID_TO_ANKR_BLOCKCHAIN: { [chainId: number]: string } = {
  1: 'eth',        // Ethereum Mainnet
  8453: 'base',    // Base
  42161: 'arbitrum', // Arbitrum One
  10: 'optimism',  // Optimism
  534352: 'scroll', // Scroll
  100: 'gnosis',   // Gnosis Chain
  480: 'worldchain' // World Chain
};

export interface AnkrTokenPriceRequest {
  blockchain: string;
  contractAddress?: string;
  symbol?: string;
}

export interface AnkrTokenPriceResponse {
  jsonrpc: string;
  id: number;
  result: {
    usdPrice: string;
    blockchain: string;
    contractAddress?: string;
    symbol?: string;
  };
}

export const getAnkrMarketRateUsd = async (
  chainId: number,
  tokenAddress: string,
  ankrApiKey: string
): Promise<number | undefined> => {
  const blockchain = CHAIN_ID_TO_ANKR_BLOCKCHAIN[chainId];
  
  if (!blockchain) {
    console.warn(`Unsupported chain ID for Ankr API: ${chainId}`);
    return undefined;
  }

  try {
    const requestBody = {
      jsonrpc: '2.0',
      method: 'ankr_getTokenPrice',
      params: {
        blockchain,
        contractAddress: tokenAddress.toLowerCase()
      } as AnkrTokenPriceRequest,
      id: 1
    };

    const response = await fetch(ANKR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ankrApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.warn(`Ankr API request failed with status: ${response.status}`);
      return undefined;
    }

    const data = await response.json() as AnkrTokenPriceResponse;
    
    if (data.result && data.result.usdPrice) {
      const price = parseFloat(data.result.usdPrice);
      return isNaN(price) ? undefined : price;
    }

    return undefined;
  } catch (error) {
    console.warn('Error fetching token price from Ankr:', error);
    return undefined;
  }
};

export const getAnkrNativeTokenMarketRateUsd = async (
  chainId: number,
  ankrApiKey: string
): Promise<number | undefined> => {
  const blockchain = CHAIN_ID_TO_ANKR_BLOCKCHAIN[chainId];
  
  if (!blockchain) {
    console.warn(`Unsupported chain ID for Ankr API: ${chainId}`);
    return undefined;
  }

  // For native tokens, we can use the symbol approach
  const nativeSymbolMap: { [chainId: number]: string } = {
    1: 'ETH',
    8453: 'ETH', // Base uses ETH
    42161: 'ETH', // Arbitrum uses ETH
    10: 'ETH', // Optimism uses ETH
    534352: 'ETH', // Scroll uses ETH
    100: 'XDAI', // Gnosis uses xDAI
    480: 'ETH' // World Chain uses ETH
  };

  const symbol = nativeSymbolMap[chainId];
  if (!symbol) {
    return undefined;
  }

  try {
    const requestBody = {
      jsonrpc: '2.0',
      method: 'ankr_getTokenPrice',
      params: {
        blockchain,
        symbol
      } as AnkrTokenPriceRequest,
      id: 1
    };

    const response = await fetch(ANKR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ankrApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.warn(`Ankr API request failed with status: ${response.status}`);
      return undefined;
    }

    const data = await response.json() as AnkrTokenPriceResponse;
    
    if (data.result && data.result.usdPrice) {
      const price = parseFloat(data.result.usdPrice);
      return isNaN(price) ? undefined : price;
    }

    return undefined;
  } catch (error) {
    console.warn('Error fetching native token price from Ankr:', error);
    return undefined;
  }
};
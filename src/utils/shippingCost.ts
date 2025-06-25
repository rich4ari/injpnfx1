// Enhanced shipping cost calculation system for Japan prefectures
export interface ShippingRate {
  prefecture: string;
  cost: number;
  estimatedDays: string;
}

// Comprehensive shipping rates for all 47 prefectures in Japan
export const shippingRates: ShippingRate[] = [
  // Kanto Region (Free shipping threshold: ¥10,000)
  { prefecture: '東京都', cost: 600, estimatedDays: '1-2 hari' },
  { prefecture: '神奈川県', cost: 600, estimatedDays: '1-2 hari' },
  { prefecture: '埼玉県', cost: 600, estimatedDays: '1-2 hari' },
  { prefecture: '千葉県', cost: 600, estimatedDays: '1-2 hari' },
  { prefecture: '茨城県', cost: 700, estimatedDays: '2-3 hari' },
  { prefecture: '栃木県', cost: 700, estimatedDays: '2-3 hari' },
  { prefecture: '群馬県', cost: 700, estimatedDays: '2-3 hari' },

  // Kansai Region
  { prefecture: '大阪府', cost: 800, estimatedDays: '2-3 hari' },
  { prefecture: '京都府', cost: 800, estimatedDays: '2-3 hari' },
  { prefecture: '兵庫県', cost: 800, estimatedDays: '2-3 hari' },
  { prefecture: '奈良県', cost: 800, estimatedDays: '2-3 hari' },
  { prefecture: '滋賀県', cost: 800, estimatedDays: '2-3 hari' },
  { prefecture: '和歌山県', cost: 850, estimatedDays: '3-4 hari' },

  // Chubu Region
  { prefecture: '愛知県', cost: 750, estimatedDays: '2-3 hari' },
  { prefecture: '静岡県', cost: 700, estimatedDays: '2-3 hari' },
  { prefecture: '岐阜県', cost: 750, estimatedDays: '2-3 hari' },
  { prefecture: '三重県', cost: 800, estimatedDays: '2-3 hari' },
  { prefecture: '長野県', cost: 750, estimatedDays: '2-3 hari' }, // Your location
  { prefecture: '山梨県', cost: 700, estimatedDays: '2-3 hari' },
  { prefecture: '新潟県', cost: 800, estimatedDays: '3-4 hari' },
  { prefecture: '富山県', cost: 800, estimatedDays: '3-4 hari' },
  { prefecture: '石川県', cost: 850, estimatedDays: '3-4 hari' },
  { prefecture: '福井県', cost: 850, estimatedDays: '3-4 hari' },

  // Tohoku Region
  { prefecture: '宮城県', cost: 900, estimatedDays: '3-4 hari'  },
  { prefecture: '福島県', cost: 850, estimatedDays: '3-4 hari'  },
  { prefecture: '山形県', cost: 900, estimatedDays: '3-4 hari'  },
  { prefecture: '岩手県', cost: 950, estimatedDays: '3-5 hari'  },
  { prefecture: '秋田県', cost: 950, estimatedDays: '3-5 hari'  },
  { prefecture: '青森県', cost: 1000, estimatedDays: '3-5 hari'  },

  // Chugoku Region
  { prefecture: '広島県', cost: 900, estimatedDays: '3-4 hari'  },
  { prefecture: '岡山県', cost: 850, estimatedDays: '3-4 hari'  },
  { prefecture: '山口県', cost: 950, estimatedDays: '3-5 hari'  },
  { prefecture: '島根県', cost: 950, estimatedDays: '3-5 hari'  },
  { prefecture: '鳥取県', cost: 900, estimatedDays: '3-4 hari'  },

  // Shikoku Region
  { prefecture: '愛媛県', cost: 900, estimatedDays: '3-4 hari'  },
  { prefecture: '香川県', cost: 850, estimatedDays: '3-4 hari'  },
  { prefecture: '高知県', cost: 950, estimatedDays: '3-5 hari'  },
  { prefecture: '徳島県', cost: 900, estimatedDays: '3-4 hari'  },

  // Kyushu Region
  { prefecture: '福岡県', cost: 950, estimatedDays: '3-5 hari'  },
  { prefecture: '佐賀県', cost: 1000, estimatedDays: '3-5 hari'  },
  { prefecture: '長崎県', cost: 1050, estimatedDays: '3-5 hari'  },
  { prefecture: '熊本県', cost: 1000, estimatedDays: '3-5 hari'  },
  { prefecture: '大分県', cost: 1000, estimatedDays: '3-5 hari'  },
  { prefecture: '宮崎県', cost: 1050, estimatedDays: '3-5 hari'  },
  { prefecture: '鹿児島県', cost: 1100, estimatedDays: '4-6 hari'  },

  // Okinawa
  { prefecture: '沖縄県', cost: 1500, estimatedDays: '5-7 hari'  },

  // Hokkaido
  { prefecture: '北海道', cost: 1200, estimatedDays: '4-6 hari'  }
];

// Free shipping thresholds
const GLOBAL_FREE_SHIPPING_THRESHOLD = 15000; // ¥15,000 for all of Japan
const KANTO_REGION_FREE_SHIPPING_THRESHOLD = 10000; // ¥10,000 for Kanto region

// Kanto region prefectures
const KANTO_PREFECTURES = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'];

/**
 * Check if order qualifies for free shipping
 * @param subtotal Order subtotal
 * @param prefecture Destination prefecture
 * @returns Boolean indicating if shipping is free
 */
export const isFreeShipping = (subtotal: number, prefecture: string): boolean => {
  if (!prefecture || !subtotal) {
    return false;
  }
  
  // Free shipping for all Japan if order is above global threshold
  if (subtotal >= GLOBAL_FREE_SHIPPING_THRESHOLD) {
    return true;
  }
  
  // Special lower threshold for Kanto region
  if (KANTO_PREFECTURES.includes(prefecture) && subtotal >= KANTO_REGION_FREE_SHIPPING_THRESHOLD) {
    return true;
  }
  
  return false;
};

/**
 * Calculate shipping cost based on prefecture and order subtotal
 * @param prefecture Destination prefecture
 * @param subtotal Order subtotal (optional)
 * @returns Shipping rate details including cost
 */
export const calculateShippingCost = async (prefecture: string, subtotal?: number): Promise<ShippingRate | null> => {
  try {
    if (!prefecture) {
      console.warn('Prefecture is required for shipping calculation');
      return null;
    }
    
    // Find shipping rate for the prefecture
    const rate = shippingRates.find(r => r.prefecture === prefecture);
    
    if (!rate) {
      console.warn(`No shipping rate found for prefecture: ${prefecture}`);
      return null;
    }
    
    // Apply free shipping if applicable
    if (subtotal !== undefined && isFreeShipping(subtotal, prefecture)) {
      return {
        ...rate,
        cost: 0
      };
    }
    
    return rate;
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    return null;
  }
};

/**
 * Format shipping cost for display
 * @param cost Shipping cost in yen
 * @returns Formatted string
 */
export const formatShippingCost = (cost: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(cost);
};
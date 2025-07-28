// Comprehensive device detection utilities
export class DeviceDetection {
  static getUserAgent(): string {
    return navigator.userAgent;
  }

  static getDetailedDeviceInfo() {
    const userAgent = navigator.userAgent;
    const userAgentLower = userAgent.toLowerCase();
    
    // Samsung detection patterns
    const samsungPatterns = [
      { pattern: /samsung/i, name: 'Samsung Brand' },
      { pattern: /sm-[a-z]\d+/i, name: 'Samsung Model (SM-)' },
      { pattern: /galaxy/i, name: 'Galaxy Series' },
      { pattern: /gt-[a-z]\d+/i, name: 'Samsung Model (GT-)' },
      { pattern: /samsung browser/i, name: 'Samsung Browser' },
      { pattern: /secbrowser/i, name: 'Samsung SecBrowser' },
      { pattern: /samsungbrowser/i, name: 'Samsung Browser App' },
    ];

    const detectedPatterns = samsungPatterns.filter(({ pattern }) => pattern.test(userAgent));
    const isSamsung = detectedPatterns.length > 0 || 
                     userAgentLower.includes('samsung') || 
                     userAgentLower.includes('galaxy');

    return {
      userAgent,
      userAgentLower,
      isSamsung,
      detectedPatterns: detectedPatterns.map(p => p.name),
      browserInfo: {
        isSamsungBrowser: userAgentLower.includes('samsungbrowser') || userAgentLower.includes('secbrowser'),
        isChrome: userAgentLower.includes('chrome'),
        isFirefox: userAgentLower.includes('firefox'),
        isSafari: userAgentLower.includes('safari') && !userAgentLower.includes('chrome'),
      },
      deviceInfo: {
        isAndroid: userAgentLower.includes('android'),
        isIOS: /iphone|ipad|ipod/i.test(userAgent),
        isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
      }
    };
  }

  static logDeviceInfo() {
    const info = this.getDetailedDeviceInfo();
    console.log('📱 Complete Device Detection Report:', info);
    return info;
  }

  static isSamsungDevice(): boolean {
    const info = this.getDetailedDeviceInfo();
    console.log('📱 Samsung Detection Result:', {
      isSamsung: info.isSamsung,
      detectedPatterns: info.detectedPatterns,
      userAgent: info.userAgent.slice(0, 100)
    });
    return info.isSamsung;
  }
}
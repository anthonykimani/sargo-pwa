// hooks/useStakingDemo.ts
import { useState, useEffect } from 'react';

export function useStakingDemo() {
  const [demoData, setDemoData] = useState({
    sargoBalance: "1000.0",
    xSargoBalance: "500.0",
    stakeInfo: {
      amount: "250.0",
      unlockTime: Date.now() + (90 * 24 * 60 * 60 * 1000)
    }
  });

  const simulateStaking = async (amount: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setDemoData(prev => ({
          ...prev,
          sargoBalance: (parseFloat(prev.sargoBalance) - parseFloat(amount)).toString(),
          xSargoBalance: (parseFloat(prev.xSargoBalance) + parseFloat(amount)).toString(),
        }));
        resolve(true);
      }, 2000);
    });
  };

  const simulateUnstaking = async (amount: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setDemoData(prev => ({
          ...prev,
          sargoBalance: (parseFloat(prev.sargoBalance) + parseFloat(amount)).toString(),
          xSargoBalance: (parseFloat(prev.xSargoBalance) - parseFloat(amount)).toString(),
        }));
        resolve(true);
      }, 2000);
    });
  };

  return {
    demoData,
    simulateStaking,
    simulateUnstaking
  };
}
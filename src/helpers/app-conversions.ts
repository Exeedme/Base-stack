export const convertUSDToDiamonds = (usd: number) => {
  return Math.round(usd * 100);
};

export const convertDiamondsToUSD = (diamonds: number) => {
  return (diamonds / 100).toFixed(2);
};

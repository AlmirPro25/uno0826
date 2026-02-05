// RevenueCard.tsx
import { ArrowUp, ArrowDown } from 'lucide-react';

interface RevenueCardProps {
  totalRevenue: number;
  growthPercentage: number;
}

const RevenueCard: React.FC<RevenueCardProps> = ({ totalRevenue, growthPercentage }) => {
  const isPositiveGrowth = growthPercentage >= 0;

  return (
    <div className="bg-gray-900 rounded-md p-4 border border-white/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Receita Total</h3>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-semibold text-white font-mono tabular-nums">${totalRevenue.toLocaleString('en-US')}</p>
        <div className="mt-1 flex items-center text-sm">
          {isPositiveGrowth ? (
            <ArrowUp className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`ml-1 font-medium ${isPositiveGrowth ? 'text-green-500' : 'text-red-500'}`}>
            {isPositiveGrowth ? '+' : ''}{growthPercentage.toFixed(1)}%
          </span>
          {/* Mini sparkline placeholder - replace with actual sparkline component */}
          <span className="ml-2 text-gray-500">(Sparkline)</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueCard;
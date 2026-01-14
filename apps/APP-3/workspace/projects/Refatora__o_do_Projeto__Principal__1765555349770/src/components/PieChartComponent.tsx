
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

// --- Paleta de Cores do Gráfico ---
const COLORS = [
  '#10b981', // green accent
  '#3b82f6', // blue
  '#f59e0b', // yellow
  '#ef4444', // red
  '#a855f7', // purple
  '#ec4899', // pink
];

// --- Custom Tooltip para o Gráfico de Pizza ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-800 p-3 rounded-md shadow-lg border border-gray-700 text-sm">
        <p className="font-semibold text-gray-50">{data.category}</p>
        <p className="text-gray-300">Valor: {data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        <p className="text-gray-300">Percentual: {data.percentage.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

// --- Componente do Gráfico de Pizza ---
interface PieChartComponentProps {
  data: { category: string; amount: number; percentage: number }[];
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({ data }) => {
  // Filtra categorias com valor zero para não poluir o gráfico
  const filteredData = useMemo(() => data.filter(item => item.amount > 0), [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={filteredData}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          labelLine={false}
          label={({ percent, category }) => `${category} (${(percent * 100).toFixed(0)}%)`}
          animationDuration={500}
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;

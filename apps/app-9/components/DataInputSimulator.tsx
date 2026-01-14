import React, { useState, useCallback } from 'react';
import type { Layer } from '../types';

interface DataInputSimulatorProps {
  inputLayer: Layer;
  onDataInput: (data: number[]) => void;
}

export const DataInputSimulator: React.FC<DataInputSimulatorProps> = ({ 
  inputLayer, 
  onDataInput 
}) => {
  const [inputValues, setInputValues] = useState<number[]>(
    new Array(inputLayer.shape?.[0] || 8).fill(0)
  );
  const [isSimulating, setIsSimulating] = useState(false);

  const handleInputChange = useCallback((index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newValues = [...inputValues];
    newValues[index] = numValue;
    setInputValues(newValues);
    onDataInput(newValues);
  }, [inputValues, onDataInput]);

  const generateRandomData = useCallback(() => {
    const randomValues = inputValues.map(() => Math.random() * 2 - 1); // -1 to 1
    setInputValues(randomValues);
    onDataInput(randomValues);
  }, [inputValues.length, onDataInput]);

  const simulateRealTimeData = useCallback(() => {
    setIsSimulating(!isSimulating);
    
    if (!isSimulating) {
      const interval = setInterval(() => {
        const randomValues = inputValues.map(() => Math.random() * 2 - 1);
        setInputValues(randomValues);
        onDataInput(randomValues);
      }, 500);
      
      // Store interval ID for cleanup
      (window as any).simulationInterval = interval;
    } else {
      clearInterval((window as any).simulationInterval);
    }
  }, [isSimulating, inputValues.length, onDataInput]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Simulador de Entrada</h3>
        <div className="flex space-x-2">
          <button
            onClick={generateRandomData}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Aleatório
          </button>
          <button
            onClick={simulateRealTimeData}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isSimulating 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSimulating ? 'Parar' : 'Tempo Real'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {inputValues.map((value, index) => (
          <div key={index} className="flex items-center space-x-2">
            <label className="text-xs text-gray-400 w-8">x{index}</label>
            <input
              type="number"
              value={value.toFixed(3)}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
              step="0.001"
              min="-1"
              max="1"
            />
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        Formato de entrada: [{inputLayer.shape?.join(' × ') || 'N/A'}]
      </div>
    </div>
  );
};

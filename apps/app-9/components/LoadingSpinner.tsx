
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-purple-400">
      <defs>
        <filter id="spinner-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"></feGaussianBlur>
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 5 -2" result="glow"></feColorMatrix>
          <feComposite in="SourceGraphic" in2="glow" operator="over"></feComposite>
        </filter>
      </defs>
      <g filter="url(#spinner-glow)">
        <circle cx="12" cy="3" r="0" fill="currentColor">
          <animate id="spinner_3" begin="0;spinner_1f.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
        <circle cx="12" cy="21" r="0" fill="currentColor">
          <animate id="spinner_1b" begin="spinner_e.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
        <circle cx="3" cy="12" r="0" fill="currentColor">
          <animate id="spinner_d" begin="spinner_19.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
        <circle cx="21" cy="12" r="0" fill="currentColor">
          <animate id="spinner_f" begin="spinner_1d.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
        <circle cx="18.36" cy="5.64" r="0" fill="currentColor">
          <animate id="spinner_1d" begin="spinner_3.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
        <circle cx="5.64" cy="18.36" r="0" fill="currentColor">
          <animate id="spinner_1e" begin="spinner_1b.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
        <circle cx="5.64" cy="5.64" r="0" fill="currentColor">
          <animate id="spinner_19" begin="spinner_1f.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
        <circle cx="18.36" cy="18.36" r="0" fill="currentColor">
          <animate id="spinner_e" begin="spinner_d.end-0.25s" attributeName="r" dur="0.75s" values="0;2;0" />
        </circle>
      </g>
    </svg>
  );
};

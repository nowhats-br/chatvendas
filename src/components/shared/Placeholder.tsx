import React from 'react';
import { HardHat } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description?: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ title, description }) => (
  <div className="p-6 h-full flex items-center justify-center bg-gray-100">
    <div className="text-center max-w-lg">
      <HardHat className="mx-auto text-yellow-500 mb-4" size={56} />
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">
        {description || 'Esta funcionalidade está em desenvolvimento e estará disponível em breve.'}
      </p>
    </div>
  </div>
);

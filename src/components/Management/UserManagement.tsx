import React from 'react';
import { Placeholder } from '../shared/Placeholder';

interface UserManagementProps {
  activeTab: 'users' | 'queues' | 'teams';
}

export const UserManagement: React.FC<UserManagementProps> = ({ activeTab }) => {
  const titles = {
    users: "Gerenciamento de Usuários",
    queues: "Gerenciamento de Filas",
    teams: "Gerenciamento de Equipes",
  };
  return <Placeholder title={titles[activeTab]} />;
};

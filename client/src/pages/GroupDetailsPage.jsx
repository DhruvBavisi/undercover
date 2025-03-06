import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const GroupDetailsPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Group ID:', groupId);
  }, [groupId]);

  // Fetch group details based on groupId
  const group = {
    name: 'Team Undercover',
    description: 'This is the undercover team',
    members: ['Dhruv', 'Meet', 'Jenil', 'Adhvay', 'Siddh'],
  };

  const handleStartGame = () => {
    navigate('/offline', { state: { playerNames: group.members } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">{group.name}</h1>
        <p className="text-gray-300 mb-6 text-center">{group.description}</p>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Members</h2>
          <ul className="space-y-2">
            {group.members.map((member, index) => (
              <li key={index} className="bg-gray-700 p-3 rounded-md hover:bg-gray-600 transition-colors">
                <span className="text-gray-300">{member}</span>
              </li>
            ))}
          </ul>
          <button
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            onClick={handleStartGame}
          >
            Start Game with This Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsPage;

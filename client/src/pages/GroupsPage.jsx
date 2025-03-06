import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const GroupsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'join'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home button */}
        <Link to="/" className="inline-block mb-8">
          <Button className="bg-gray-700 hover:bg-gray-600">
            ← Back to Home
          </Button>
        </Link>

        {/* Main content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Groups</h1>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setModalType('create');
                setShowModal(true);
              }}
            >
              Create/Join Group
            </Button>
          </div>

          {/* Group stats and history will go here */}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              {modalType === 'create' ? (
                <CreateGroupForm onClose={() => setShowModal(false)} />
              ) : (
                <JoinGroupForm onClose={() => setShowModal(false)} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CreateGroupForm = ({ onClose }) => {
  const [groupName, setGroupName] = useState('');

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Create Group</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
        />
        <div className="flex justify-end space-x-2">
          <Button className="bg-gray-700 hover:bg-gray-600" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Create
          </Button>
        </div>
      </div>
    </>
  );
};

const JoinGroupForm = ({ onClose }) => {
  const [groupCode, setGroupCode] = useState('');

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Join Group</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Group Code"
          value={groupCode}
          onChange={(e) => setGroupCode(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
        />
        <div className="flex justify-end space-x-2">
          <Button className="bg-gray-700 hover:bg-gray-600" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Join
          </Button>
        </div>
      </div>
    </>
  );
};

export default GroupsPage;

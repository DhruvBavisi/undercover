import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import axios from 'axios';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [modalType, setModalType] = useState('create');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]); // Fallback to empty array on error
    }
  };

  const handleCreateGroup = async (groupName, members) => {
    try {
      const response = await axios.post('/api/groups', {
        name: groupName,
        members,
      });
      setGroups([...groups, response.data]);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

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

          {/* Group cards */}
          <div className="space-y-4">
            {Array.isArray(groups) && groups.map((group) => (
              <Link key={group._id} to={`/group/${group._id}`}>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors">
                  <h2 className="text-xl font-bold mb-2">{group.name}</h2>
                  <p className="text-gray-300 mb-4">{group.description}</p>
                  <div className="flex space-x-2">
                    {Array.isArray(group.members) && group.members.map((member, index) => (
                      <span key={index} className="bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-300">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                {modalType === 'create' ? (
                  <CreateGroupForm onClose={() => setShowModal(false)} onCreateGroup={handleCreateGroup} />
                ) : (
                  <JoinGroupForm onClose={() => setShowModal(false)} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const formatMemberName = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const CreateGroupForm = ({ onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState('');

  const handleAddMember = () => {
    if (newMember.trim()) {
      setMembers([...members, formatMemberName(newMember.trim())]);
      setNewMember('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (groupName.trim() && members.length > 0) {
      onCreateGroup(groupName, members);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Members</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                placeholder="Add member"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.isArray(members) && members.map((member, index) => (
                <span key={index} className="bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-300">
                  {member}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
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
